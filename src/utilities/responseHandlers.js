const handleResponse = (res, message, error_code, data) => {
  return res.json({
    message: message,
    status: error_code,
    data: data,
  });
};

module.exports = {
  handleResponse,
};
