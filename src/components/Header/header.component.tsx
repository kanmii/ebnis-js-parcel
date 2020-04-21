import React from "react";
import { createPortal } from "react-dom";
import SVG from "react-inlinesvg";
import logo from "../../media/logo.svg";
import "./header.styles.scss";

export function Header(props: { appLogo?: string }) {
  const {
    appLogo = logo, //
  } = props;

  return createPortal(
    <header className="app-header">
      <SVG src={appLogo} className="logo" />
    </header>,
    document.body
  );
}

export default Header;
