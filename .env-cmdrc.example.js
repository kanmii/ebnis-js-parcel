module.exports = {
  dev: {
    PORT: "4021",
    API_URL: "http://localhost:4023",
  },
  test: {
    API_URL: "http://localhost:4022",
    IS_UNIT_TEST: "true",
  },
  prod: {
    API_URL: "http://localhost:4022",
    REGISTER_SERVICE_WORKER: true,
  },
  e2eDev: {
    PORT: "3022",
    API_URL: "http://localhost:4022",
    CYPRESS_API_URL: "http://localhost:4022",
    IS_E2E: "true",
  },
  e2eRun: {
    API_URL: "http://localhost:4022",
    CYPRESS_API_URL: "http://localhost:4022",
    IS_E2E: "true",
    NO_LOG: "true",
    BROWSER: "none",
  },
  staging: {
    API_URL: "http://localhost:4022",
    NO_LOG: "true",
  },
};
