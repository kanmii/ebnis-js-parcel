import React, { useLayoutEffect } from "react";
import logo from "../../media/logo.svg";
import Header from "../Header/header.component";
import {
  MY_TITLE, //
} from "./my.dom";
import { setDocumentTitle } from "../../utils/global-window";

export function My() {
  useLayoutEffect(() => {
    setDocumentTitle(MY_TITLE);
  }, []);

  return (
    <>
      <Header appLogo={logo} />

      <div>my my</div>
    </>
  );
}

// istanbul ignore next:
export default My;
