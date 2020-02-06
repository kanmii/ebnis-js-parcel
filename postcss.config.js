/* eslint-disable @typescript-eslint/no-var-requires*/
module.exports = {
  plugins: [
    require("autoprefixer"),
    require("tailwindcss"),
    require("postcss-import"),
    require("postcss-preset-env")({ stage: 1 }),
    require("postcss-custom-properties"),
  ],
};
