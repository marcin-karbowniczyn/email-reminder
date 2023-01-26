const Reminder = require('../models/reminderModel');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');
const AppError = require('../utils/appError');

const checkPermanentAndChangeYear = async (reminder) => {
  // If reminder has a permanent tag, then change year of the reminder to make it work next year
  if (reminder.permanent) {
    // 1. Retrieve date from reminder and convert it to array
    const dateArr = reminder.reminderDate.toString().split(' ');

    // 2. Change year of reminder date by 1
    const newYear = (dateArr[3] * 1 + 1).toString();

    // 3. Replace outdated reminder date in date array
    dateArr.splice(3, 1, newYear);

    // 4. Convert array to a Date format and save new date into reminder document
    reminder.reminderDate = dateArr.join(' ');

    // 5. Mark checks as false again
    for (const prop in reminder.sentCheck) {
      reminder.sentCheck[prop] = false;
    }

    // 6. Save a reminder
    await reminder.save({ validateBeforeSave: false });
  }
};

const sendAndUpdateReminder = async (reminder, i, typeOfReminder) => {
  try {
    console.log(`Reminder ${i} is now being processed.`);
    await new Email(reminder).sendEmail();

    // 2. Mark a reminder as sent
    reminder.sentCheck[`${typeOfReminder}`] = true;
    await reminder.save({ validateBeforeSave: false });
  } catch (err) {
    console.log('Error while sending or updating reminder', err);
  }
};

exports.manageReminders = async () => {
  try {
    const reminders = await Reminder.find().populate({
      path: 'user',
    });

    console.log('Sending has been started...');
    for (let i = 0; i < reminders.length; i++) {
      // 1. Check if reminder is outdated, if true, delete it.
      if (typeof reminders[i].daysUntilReminder === 'string') {
        await Reminder.findByIdAndDelete(reminders[i].id);
        continue;
      }

      // 2a. Send reminder 1 month ahead.
      if (
        reminders[i].daysUntilReminder <= 30 &&
        reminders[i].daysUntilReminder > 7 &&
        !reminders[i].sentCheck.month
      ) {
        await sendAndUpdateReminder(reminders[i], i, 'month');
        continue;
        // 2b. Send reminder 1 week ahead.
      } else if (
        reminders[i].daysUntilReminder <= 7 &&
        reminders[i].daysUntilReminder > 3 &&
        !reminders[i].sentCheck.week
      ) {
        await sendAndUpdateReminder(reminders[i], i, 'week');
        continue;
        // 2c. Send reminder three days ahead.
      } else if (
        reminders[i].daysUntilReminder <= 3 &&
        reminders[i].daysUntilReminder > 1 &&
        !reminders[i].sentCheck.threeDays
      ) {
        await sendAndUpdateReminder(reminders[i], i, 'threeDays');
        continue;
        // 2d. Send Reminder one day ahead.
      } else if (
        reminders[i].daysUntilReminder === 1 &&
        !reminders[i].sentCheck.oneDay
      ) {
        await sendAndUpdateReminder(reminders[i], i, 'oneDay');
        continue;
        // 2e. Send Reminder on a reminder date.
      } else if (
        !reminders[i].daysUntilReminder &&
        !reminders[i].sentCheck.today
      ) {
        // Toeretycznie jak coś pójdzie nie tak, to przy następnym wywołaniu funkcji permanentny remainder zostanie usunięty
        await sendAndUpdateReminder(reminders[i], i, 'today');
        await checkPermanentAndChangeYear(reminders[i]);
        continue;
      }
    }
    console.log('Sending completed.');
  } catch (err) {
    console.log(err);
  }
};

exports.checkIfAuthor = catchAsync(async (req, res, next) => {
  // SAFER SOLUTION (POPULATE)
  // const reminder = await Reminder.findById(req.params.id).populate({
  //   path: 'user'
  // });
  const reminder = await Reminder.findById(req.params.id);

  // MORE EFFICIENT SOLUTION (TO STRING)
  if (req.user.role !== 'admin') {
    if (req.user.id !== reminder.user.toString())
      return next(
        new AppError(`You can only view or edit your own reminder.`, 401)
      );
  }

  next();
});

exports.createReminder = catchAsync(async (req, res, next) => {
  const newReminder = await Reminder.create({
    title: req.body.title,
    reminderDate: req.body.reminderDate,
    user: req.user._id,
    permanent: req.body.permanent,
  });

  res.status(200).json({
    status: 'success',
    data: {
      newReminder,
    },
  });
});

// Only for admins
exports.getAllReminders = catchAsync(async (req, res, next) => {
  const reminders = await Reminder.find();

  res.status(200).json({
    status: 'success',
    results: reminders.length,
    data: {
      reminders,
    },
  });
});

exports.getOneReminder = catchAsync(async (req, res, next) => {
  const reminder = await Reminder.findOne({ _id: req.params.id });

  if (!reminder)
    return next(new AppError('There is no remainder with this id.', 404));

  res.status(200).json({
    status: 'success',
    data: {
      reminder,
    },
  });
});

// Eventually this will be taken to userController module.
exports.getMyReminders = catchAsync(async (req, res, next) => {
  const reminders = await Reminder.find({ user: req.user.id });
  res.status(200).json({
    status: 'success',
    results: reminders.length,
    data: {
      reminders,
    },
  });
});

exports.updateReminder = catchAsync(async (req, res, next) => {
  const updatedReminder = await Reminder.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedReminder)
    return next(new AppError('There is no remainder with this id.', 404));

  res.status(200).json({
    status: 'success',
    data: {
      updatedReminder,
    },
  });
});

exports.deleteReminder = catchAsync(async (req, res, next) => {
  await Reminder.findByIdAndDelete(req.params.id);

  if (req.user)
    res.status(204).json({
      status: 'success',
      data: null,
    });
});

// FOR TESTING PURPOSES
exports.deleteAllReminders = catchAsync(async (req, res, next) => {
  await Reminder.deleteMany();
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
