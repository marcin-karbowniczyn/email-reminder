const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createUser = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      newUser,
    },
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findOneAndUpdate(
    { _id: req.params.id },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!updatedUser)
    return next(new AppError(`There is no user with this id`, 404));

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser,
    },
  });
});

exports.getOneUser = catchAsync(async (req, res, next) => {
  let user = await User.findById({ _id: req.params.id });

  if (!user) return next(new AppError(`There is no user with this id`, 404));

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError('There is no user with this id', 404));

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
