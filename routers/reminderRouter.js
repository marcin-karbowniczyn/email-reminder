const express = require('express');
const reminderController = require('../controllers/reminderController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.get('/myReminders', reminderController.getMyReminders);

// prettier-ignore
router
  .route('/')
  .get(authController.restrictedTo('admin'), reminderController.getAllReminders)
  .post(reminderController.createReminder);

// ONLY FOR ADMINS, DO NOT USE IF ALREADY IN PRODUCTION
router.delete(
  '/testing/deleteAllReminders',
  authController.restrictedTo('admin'),
  reminderController.deleteAllReminders
);

router
  .route('/:id')
  .get(reminderController.checkIfAuthor, reminderController.getOneReminder)
  .patch(reminderController.checkIfAuthor, reminderController.updateReminder)
  .delete(reminderController.checkIfAuthor, reminderController.deleteReminder);

module.exports = router;
