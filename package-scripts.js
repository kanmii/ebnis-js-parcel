/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const fs = require("fs");
const shell = require("shelljs");
const pkg = require("./package.json");
const settings = require("./.env-cmdrc");

const distFolder = path.resolve(__dirname, "./dist");

const test = "env-cmd -e test yarn jest --runInBand";
const testWatch = test + " --watch";
const testWatchCoverage = testWatch + " --coverage";

const build =
  "rimraf dist && env-cmd -e prod parcel build public/index.html && env-cmd -e prod yarn start serviceWorker";

module.exports = {
  scripts: {
    dev: "env-cmd -e dev parcel public/index.html --cache-dir .cache",
    build: {
      default: build,
      deploy: build + "  && yarn start netlify",
      serve: build + " && yarn start serve",
    },
    test: {
      default: test,
      w: testWatch,
      wc: testWatchCoverage,
      c: "rimraf coverage && " + test + " --coverage",
    },
    serve: `serve -s dist -l ${settings.serve.PORT}`,
    serviceWorker: `node -e 'require("./package-scripts").serviceWorker()'`,
    netlify: `node -e 'require("./package-scripts").netlify()'`,
  },
  serviceWorker() {
    const { copyWorkboxLibraries, injectManifest } = require("workbox-build");

    const workboxPath =
      "workbox-v" + pkg.devDependencies["workbox-build"].match(/(\d.+)/)[1];

    const swSrc = "service-worker.js";
    const swSrcAbsPath = path.resolve(__dirname, swSrc);
    const swTemplateSrc = path.resolve(__dirname, "service-worker.template.js");

    const swCode = fs
      .readFileSync(swTemplateSrc, "utf8")
      .replace(/%workboxPath%/g, workboxPath);

    fs.writeFileSync(swSrcAbsPath, swCode);

    copyWorkboxLibraries(distFolder);

    console.log(
      `\n*** copied workbox runtime libraries to "${path.resolve(
        distFolder,
        workboxPath
      )}".`
    );

    injectManifest({
      swSrc,
      swDest: "dist/sw.js",
      globDirectory: "dist",
      globPatterns: [
        "*.{js,css,png,svg,jpg,jpeg,ico,html,webmanifest,json}", //
      ],
      globIgnores: [
        "workbox-v*", //
        "*.map",
      ],
      dontCacheBustURLsMatching: /(\.js$|\.css$|favicon.+ico$|icon-\d+.+png$|logo\.[^.]+\.[^.]{3,4}$)/,
    }).then(({ count, filePaths, size, warnings }) => {
      console.log(
        `\n*** ${count} files were preCached:\n\t${filePaths.join(
          "\t\n"
        )}\n*** total: ${size} bytes\n`
      );

      if (warnings.length) {
        console.warn("--------WARNINGS-------\n", warnings, "\n");
      }

      shell.rm(swSrcAbsPath);
    });
  },
  netlify() {
    const NetlifyApi = require("netlify");
    const { siteId, token } = require("./.netlify/state.json");

    const netlifyClient = new NetlifyApi(token);

    console.log("\n***", "Deploying to netlify");

    netlifyClient
      .deploy(siteId, "./dist", {
        draft: false, // == production
      })
      .then((response) => {
        console.log(response);
      });
  },
};
