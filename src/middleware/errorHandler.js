const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === '23505') {
    return res.status(400).json({
      success: false,
      error: 'bad-request',
      message: 'Duplicate string. Please try again.'
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: status >= 500
      ? 'Internal server error'
      : err.message
  });
};

module.exports = { errorHandler };