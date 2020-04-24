import React from "react";
import "./header.styles.scss";
import logo from "../../media/logo.png";
import { MY_URL } from "../../utils/urls";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="app-header">
      <Link to={MY_URL}>
        <img src={logo} alt="logo" className="logo" />
      </Link>
    </header>
  );
}

export default Header;
