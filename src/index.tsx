/* istanbul ignore file */
import "core-js/stable"; // parcel can't handle async in prod
import "regenerator-runtime/runtime"; // ditto
import React from "react";
import ReactDOM from "react-dom";
import "./globals.scss";
import App from "./components/App/app1.component";
import * as serviceWorker from "./register-service-worker";

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();
