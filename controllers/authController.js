const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  // TO TRZEBA WŁĄCZYĆ PO DODANIU DOMENY!!!!!!
  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove user password from the output.
  user.password = undefined;
  user.blocked = undefined;
  user.counter = undefined;

  res.status(statusCode).json({
    status: 'success',
    data: {
      user,
    },
  });
};

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exists
  if (!email || !password)
    return next(new AppError('Please provide email and password.'), 400);

  const user = await User.findOne({ email }).select(
    '+password +counter +blocked'
  );

  // 2) Check if email adress is valid (added for blocking functionality to work properly)
  if (!user)
    return next(
      new AppError('Incorrect e-mail or password. Please try again.', 401)
    );

  // 3) Check if user is blocked
  const timeToUnblock = await user.checkIfBlocked();
  if (user.blocked) {
    const secondsToUnblock = parseInt(timeToUnblock / 1000);
    return next(
      new AppError(
        `Too many incorrect attempts. You are blocked from logging in. Wait ${secondsToUnblock} seconds and try to log again.`
      )
    );
  }

  // 4) Check if passwords matches, and update counter for incorrect login attempts
  if (!(await user.correctPassword(password, user.password))) {
    await user.isLoginIncorrect(true);
    return next(new AppError('Incorrect email or password', 401));
  } else {
    await user.isLoginIncorrect(false);
  }

  // 5) If everything is ok, send token to client
  createAndSendToken(user, 200, res);
});

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createAndSendToken(newUser, 201, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (req.headers.cookie) {
    token = req.cookies.jwt;
  }

  if (!token)
    return next(
      new AppError('You are not logged in. Please log in to gain access.', 401)
    );

  // 2) Verification token
  // Verify() to async function, 3 argument to callback, który zostanie wykonany jak skończy się weryfikacja. Weryfikuje, czy nikt nie zmieniał ID, które jest w payload tego tokenu.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );

  // 4) Check if user changed password after the JWT(token) was issued. iat = 'issued at'
  if (currentUser.changedPasswordAfterJWT(decoded.iat))
    return next(
      new AppError('User recently changed password! Please log in again.'),
      401
    );

  req.user = currentUser;
  next();
});

exports.restrictedTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError(
          `Sorry, you don't have permission to perform this action.`,
          403
        )
      );
    next();
  };
};

// THIS FUNCTION'S TASK WERE TO PREVENT DOUBLE, ALMOST IDENTICAL DB QUERIES (FIRST TO GET REMINDER BY ID AND CHECK IF AUTHOR IS CORRECT, AND THEN TO FIND REMINDER BY ID AND UPDATE).
// EVENTUALLY I DECIDED TO IMPLEMENT THE SOLUTION WITH 2 ALMOST THE SAME QUERIES, BECAUSE OF THE CLEANER CODE AND THE FACT, THAT IN BOTH SITUATIONS WE WOULD MAKE 2 QUERIES ANYWAY.
// ALSO, IT FELT INCORRECT TO ME TO HAVE A FUNCTION STRONGLY BINDED WITH REMINDER MODULE INSIDE OF AUTHENTIATION MODULE.

// exports.checkIfAuthor = catchAsync(async (req, res, next) => {
//   // If admin, proceed to next middleware
//   if (req.user.role === 'admin') return next();

//   const reminder = await Reminder.findById(req.params.id);

//   if (!reminder)
//     return next(new AppError('There is no remainder with this id.', 404));

//   if (reminder.user.toString() !== req.user.id) {
//     return next(
//       new AppError(
//         `You only can edit your own reminders. Please change reminder id you are searching for.`
//       ),
//       401
//     );
//   }
//   req.reminder = reminder;
//   next();
// });
