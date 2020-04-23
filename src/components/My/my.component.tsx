import React, { useLayoutEffect } from "react";
import logo from "../../media/logo.svg";
import Header from "../Header/header.component";
import { MY_TITLE } from "./my.dom";
import { setUpRoutePage } from "../../utils/global-window";
import "./my.styles.scss";
import NewExperience from "../NewExperience/new-experience.component";

export function My() {
  useLayoutEffect(() => {
    setUpRoutePage({
      title: MY_TITLE,
      rootClassName: "my-component",
    });
  }, []);

  return (
    <>
      <Header appLogo={logo} />

      <NewExperience />

      <div className="new-experience-trigger">
        <span>+</span>
      </div>
    </>
  );
}

// istanbul ignore next:
export default My;
