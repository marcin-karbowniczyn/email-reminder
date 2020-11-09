const AppError = require('../utils/appError');

// Third party modules errors
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);

const handleCastError = (err) => {
  if (err.path === '_id') err.path = 'id';
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};

const handleDuplicateFieldsDB = (err) => {
  if (err.keyValue.email)
    return new AppError(
      'This e-mail is already taken, please select another email.',
      400
    );

  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  return new AppError(
    `Duplicate field value: ${value}. Please use another value!`,
    400
  );
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  errors[errors.length - 1] = `${errors[errors.length - 1]}.`;
  const message = errors.join('. ');
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.statusCode,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // B) Rendered website error
  console.log('ERROR!', err);
  // Will be implemented after I decide to add frontend. //
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // If non operational, non trusted error, we send generic message to the client.
    console.log('ERROR!!!', err);
    res.status(500).json({
      status: 'error',
      message: 'Something gone wrong.',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    
    // Errors from JWT
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    // Mongoose errors
    if (error.message.startsWith('Cast')) error = handleCastError(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.message.includes('validation failed')) error = handleValidationError(error);

    sendErrorProd(error, res);
  }
};
