const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us you name'],
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Please provide your email'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: 'Password are not the same.',
    },
  },
  passwordChangedAt: Date,
  counter: {
    type: Number,
    default: 0,
    select: false,
  },
  blocked: {
    type: Boolean,
    default: false,
    select: false,
  },
  timeBlocked: Date,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfterJWT = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
    return JWTTimestamp < changedTimeStamp
  }
  return false;
}

// Update counter, if login was incorrect
userSchema.methods.isLoginIncorrect = async function(result) {
  if (result) {
    this.counter++;
  } else {
    this.counter = 0;
  }

  if (this.counter >= 5) {
    this.blocked = true;
    this.timeBlocked = Date.now() + 10 * 60 * 1000;
  }

  await this.save({ validateBeforeSave: false });
};

userSchema.methods.checkIfBlocked = async function() {
  // 1) What is the time to unblock
  let timeToUnblock;
  if (this.timeBlocked) {
    timeToUnblock = this.timeBlocked - Date.now();
  }

  // 2) Unblock if blocking time passed
  if (timeToUnblock <= 0) {
    this.blocked = false;
    this.timeBlocked = undefined;
    this.counter = 0;
    await this.save({ validateBeforeSave: false });
  }

  // 3) Return time to unblock for error handling
  return timeToUnblock;
};

module.exports = mongoose.model('User', userSchema);
