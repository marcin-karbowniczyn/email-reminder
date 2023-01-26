const mongoose = require('mongoose');

// const embeddedSchema = new mongoose.Schema({
//   foo: {
//     type: Boolean,
//   },
// });

const reminderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      minlength: [3, `Reminder's title must contain at least 3 characters.`],
      maxlength: [
        50,
        `Reminder's title must containt maximum number of 25 characters.`,
      ],
      required: [true, 'Reminder must have a title.'],
    },
    // embeddedDocument: [embeddedSchema], // How to create embedded documents.
    createdAt: {
      type: Date,
      default: Date.now,
    },
    reminderDate: {
      type: Date,
      required: [true, 'Date of reminder must be specified.'],
      validate: {
        validator: function (val) {
          return val.getTime() > Date.now() + 24 * 60 * 60 * 1000;
        },
        message:
          'Reminder must happen in the future, and must to be set at least 24 hours before the date of the reminder.',
      },
    },
    sentCheck: {
      month: {
        type: Boolean,
        default: false,
      },
      week: {
        type: Boolean,
        default: false,
      },
      threeDays: {
        type: Boolean,
        default: false,
      },
      oneDay: {
        type: Boolean,
        default: false,
      },
      today: {
        type: Boolean,
        default: false,
      },
    },
    permanent: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reminder must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual, żeby obliczyć czas do daty remindera
reminderSchema.virtual('daysUntilReminder').get(function () {
  const reminderDay = this.reminderDate.getTime();
  const today = Date.now();

  let daysUntilReminder = Math.floor(
    (reminderDay - today) / 1000 / 60 / 60 / 24
  );

  // If number of actual, real days left to reminderDate is different than daysUntilReminder, add 1 to daysUntilReminder,
  // because otherwise e-mail will say there is 2 days until reminder date, when actually there are 3.
  const daysDifference = this.reminderDate.getDate() - new Date().getDate();

  if (daysDifference !== daysUntilReminder) daysUntilReminder += 1;

  return daysUntilReminder >= 0
    ? daysUntilReminder
    : 'This reminder is out of date!';
});

const Reminder = mongoose.model('Reminder', reminderSchema);
module.exports = Reminder;
