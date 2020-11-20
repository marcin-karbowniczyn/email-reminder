const nodemailer = require('nodemailer');

module.exports = class Email {
  constructor(reminder) {
    this.to = reminder.user.email;
    this.userName = reminder.user.name;
    this.from = 'Emailnder <emailnder.test@gmail.com>';
    this.subject = reminder.title;
    this.daysUntil = reminder.daysUntilReminder;
    this.reminderDate = reminder.reminderDate;
  }

  async sendEmail() {
    let transporter;

    if (process.env.NODE_ENV === 'production') {
      transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST,
        port: process.env.MAILTRAP_PORT,
        auth: {
          user: process.env.MAILTRAP_USERNAME,
          pass: process.env.MAILTRAP_PASSWORD,
        },
        pool: true, // use pooled connection
        rateLimit: true, // enable to make sure we are limiting
        maxConnections: 1, // set limit to 1 connection only
        maxMessages: 3, // send 3 emails per second
      });
    }

    let daysUntilInfo;
    if (this.daysUntil > 1) daysUntilInfo = `in ${this.daysUntil} days`;
    if (this.daysUntil === 1) daysUntilInfo = 'tommorow';
    if (this.daysUntil === 0) daysUntilInfo = 'today';

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: this.subject,
      // prettier-ignore
      text: `Hi ${this.userName}! We just wanted to remind you, that ${this.subject} happens ${daysUntilInfo}, on ${this.reminderDate.toLocaleString('en-us', { day: 'numeric', month: 'long', year: 'numeric'})}!`,
    };

    await transporter.sendMail(mailOptions);
  }
};
