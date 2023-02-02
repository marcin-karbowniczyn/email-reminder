const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const assert = require('assert');

const reminderController = require('./controllers/reminderController');
const globalErrorHandler = require('./controllers/errorController');
const remindersRouter = require('./routers/reminderRouter');
const userRouter = require('./routers/userRouter');
const AppError = require('./utils/appError');

const app = express();

// Serving static files
// Express looks for index.js by default.
app.use(express.static(path.join(__dirname, 'public')));

// Implement CORS
app.use(cors()); // Tak aktywujemy CORS, czyli udostępniami nasze API dla klientów z innych domen a nawet subdomen. To działa tylko dla GET i POST requests, czyli simple requests.

// Getting access to req.body (converting JSON to JS Object)
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Set security HTTP headers
app.use(helmet());

// Data sanitization againt NOSQL query injection
// This middleware checks req.body, req.queryString and req.params and erases "$" and "."
app.use(mongoSanitize());

// Data sanitization against XSS (Crossed Side Script attacks)
// Ten middleware cleans user input from malicious HTML
app.use(xss());

// Console request logging middleware
app.use(morgan('dev'));

const limiter = rateLimit({
  max: 100, //How many reqs per IP
  window: 60 * 60 * 1000, // 100 reqs/hours
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

app.use('/api/reminders', remindersRouter);
app.use('/api/users', userRouter);

app.use('/', (req, res, next) => {
  res.send('<h1>Email Remainder App for programming learning purposes.</h1>');
});

// Initial delivery after app has been started
reminderController.manageReminders();

// Next remainders are being sent every hour
setInterval(() => {
  reminderController.manageReminders();
}, 1000 * 60 * 60); // Co godzinę

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  // Możemy w next() podać argument i Express będzie automatycznie wiedział, że ten argument to error. Zawsze jak podamy jakiś argument w next(), to Express weźmie go za error. Po tym Express pominie inne middlewares na stacku i przejdzie od razu do naszego global error middleware, który jest zdefiniowany poniżej.
});

app.use(globalErrorHandler);

module.exports = app;
