import React from "react";
import SVG from "react-inlinesvg";
import logo from "./logo.svg";
import "./app.css";

export function App() {
  return (
    <>
      <div className="plus-overlay" />

      <header className="header">
        <SVG src={logo} className="logo" />
      </header>

      <section className="main">
        <div className="notification is-primary">
          <button className="delete"></button>1
        </div>

        <button className="button">+</button>
        <button className="button">-</button>
      </section>
    </>
  );
}
