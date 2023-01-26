class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; // statusCode to number, więc musimy go przekonwertować do stringa
    this.isOperational = true;

    Error.captureStackTrace(this, this.contructor); // ??
  }
}

module.exports = AppError;
