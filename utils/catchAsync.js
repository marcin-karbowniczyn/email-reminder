module.exports = (fn) => (req, res, next) =>
  fn(req, res, next).catch(next);

// module.exports = (fn) => (req, res, next) =>
// fn(req, res, next).catch((err) => next(err));
