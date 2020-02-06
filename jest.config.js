module.exports = {
  collectCoverageFrom: [
    "src/**/*.ts*",
    "!src/__tests__/**",
  ],
  setupFiles: [
    "react-app-polyfill/jsdom",
  ],
  setupFilesAfterEnv: ["<rootDir>/config/jest/setupTests.js"],
  testRegex: "src/__tests__/.+?\\.test\\.tsx?$",
  testEnvironment: "jest-environment-jsdom-fourteen",
  transform: {
    "^.+\\.[jt]sx?$": "<rootDir>/node_modules/babel-jest",
    "^.+\\.css$": "<rootDir>/config/jest/cssTransform.js",
    "^(?!.*\\.(js|jsx|ts|tsx|css|json)$)":
      "<rootDir>/config/jest/fileTransform.js",
  },
  transformIgnorePatterns: [
    "[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$",
    "^.+\\.module\\.(css|sass|scss)$",
  ],
  modulePaths: [],
  moduleNameMapper: {
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
  },
  moduleFileExtensions: ["js", "ts", "tsx", "json", "jsx", "node"],
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname",
  ],
  watchPathIgnorePatterns: [
    "<rootDir>/node_modules*",
    "<rootDir>/package.json",
    "<rootDir>/dist/",
    "<rootDir>/jest\\.config\\.js",
    "<rootDir>/coverage/",
  ],
  globals: {
    __PATH_PREFIX__: "",
  },
  testURL: "http://localhost",
  extraGlobals: ["Date"],
  roots: ["<rootDir>/src"],
};
