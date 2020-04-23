import React from "react";
import { createPortal } from "react-dom";
import "./header.styles.scss";
import logo from "../../media/logo.png";

export function Header() {
  return createPortal(
    <header className="app-header">
      <img src={logo} alt="logo" className="logo" />
    </header>,
    document.body,
  );
}

export default Header;
