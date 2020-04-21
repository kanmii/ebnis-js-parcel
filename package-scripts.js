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

const startServer = "parcel public/index.html --cache-dir .cache --port";

module.exports = {
  scripts: {
    dev: `env-cmd -e dev ${startServer} ${settings.dev.PORT}`,
    e2eDev: `env-cmd -e e2eDev ${startServer} ${settings.e2eDev.PORT}`,
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
    serve: `serve -s dist -l ${settings.serve}`,
    serviceWorker: `node -e 'require("./package-scripts").serviceWorker()'`,
    netlify: `node -e 'require("./package-scripts").netlify()'`,
    cy: {
      open: "env-cmd -e e2e-dev cypress open",
      run: "server-test ",
    },
    typeCheck: {
      default: "tsc --project .",
      cypress: "tsc --project ./cypress",
    },
    lint: "eslint . --ext .js,.jsx,.ts,.tsx",
    gqlTypes: {
      e: "env-cmd -e e2eDev yarn start fetchGqlTypes",
      d: "env-cmd -e dev yarn start fetchGqlTypes",
    },
    fetchGqlTypes: `node -e 'require("./package-scripts").fetchGqlTypes()'`,
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
  fetchGqlTypes() {
    const fetch = require("node-fetch");
    const exec = require("child_process").exec;

    shell.rm("-rf", "src/graphql/apollo-types");
    const endpoint = process.env.API_URL;

    exec(
      `./node_modules/.bin/apollo codegen:generate --endpoint=${endpoint} --tagName=gql --target=typescript --includes=src/graphql/*.ts --outputFlat=src/graphql/apollo-types`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);

        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variables: {},
            query: `
      {
        __schema {
          types {
            kind
            name
            possibleTypes {
              name
            }
          }
        }
      }
    `,
          }),
        })
          .then((result) => result.json())
          .then((result) => {
            // here we're filtering out any type information unrelated to unions or interfaces
            const filteredData = result.data.__schema.types.filter(
              (type) => type.possibleTypes !== null
            );
            result.data.__schema.types = filteredData;
            fs.writeFile(
              "./src/graphql/apollo-types/fragment-types.json",
              JSON.stringify(result.data),
              (err) => {
                if (err) {
                  console.error("Error writing fragmentTypes file", err);
                } else {
                  console.log("Fragment types successfully extracted!");
                }
              }
            );
          });
      }
    );
  },
};
