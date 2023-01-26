const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config({ path: `${__dirname}/../config.env` });
const User = require('../models/userModel');

mongoose
  .connect(process.env.DB.replace('<password>', process.env.DB_PASSWORD), {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('App is connected to email-reminder database.'));

const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`));

const importData = async () => {
  try {
    await User.create(users, { validateBeforeSave: false });
    console.log('Data has been saved to DB.');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await User.deleteMany();
    console.log('Data has been deleted from DB.');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') importData();
if (process.argv[2] === '--delete') deleteData();
