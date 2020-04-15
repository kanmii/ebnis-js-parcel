import React from "react";
import {createPortal} from "react-dom";
import SVG from "react-inlinesvg";
import logo from "../../media/logo.svg";
import './header.styles.scss'

export function Header() {

  return createPortal(<header className="fixed top-0 flex items-center w-full m-0 bg-white header">
    <SVG src={logo} className="logo" />
  </header>, document.body
  )
}

export default Header
