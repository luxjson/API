const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === '23505') {
    return res.status(400).json({
      success: false,
      error: 'DUPLICATE_SLUG',
      message: 'Já existe um post com este título. Escolha um título diferente.'
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: status >= 500
      ? 'Erro interno do servidor'
      : err.message
  });
};

module.exports = { errorHandler };