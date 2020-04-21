/* eslint-disable @typescript-eslint/no-var-requires*/

const purgecss = require("@fullhuman/postcss-purgecss")({
  content: [
    "./public/index.html", //
    "./src/**/*.tsx",
  ],
  defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
});

const plugins = [];

if (process.env.NODE_ENV === "production") {
  plugins.push(purgecss);
}

module.exports = {
  plugins,
};
