import React from "react";
import logo from "../../media/logo.svg";
import Header from "../Header/header.component";

export function My(props: {}) {
  return (
    <>
      <Header appLogo={logo} />

      <div>my my</div>
    </>
  );
}

// istanbul ignore next:
export default My;
