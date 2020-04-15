module.exports = {
  dev: {
    NODE_ENV: "development",
  },
  test: {
    NODE_ENV: "test",
  },
  prod: {
    NODE_ENV: "production",
    REGISTER_SERVICE_WORKER: true,
  },
  serve: {
    PORT: "12345",
  },
};
