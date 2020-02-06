import React, { useState } from "react";
import SVG from "react-inlinesvg";
import makeClassNames from "classnames";
import logo from "./logo.svg";
import "./app.css";
import {
  notificationDomId,
  incrementBtnDomId,
  decrementBtnDomId
} from "./app.dom";

export function App() {
  const [showNotification, setShowNotification] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  return (
    <>
      <header className="fixed top-0 w-full m-0 header">
        <SVG src={logo} className="logo" />
      </header>

      <section className="relative overflow-hidden main">
        {showNotification && (
          <div
            className={makeClassNames({
              notification: true,
              "is-primary": clickCount > 0,
              "is-warning": clickCount === 0,
              "is-danger": clickCount < 0
            })}
            id={notificationDomId}
          >
            <button
              className="delete"
              onClick={() => {
                setShowNotification(false);
              }}
            />
            {clickCount}
          </div>
        )}

        <button
          className="mr-2 button"
          onClick={() => {
            const nextCount = clickCount + 1;
            setClickCount(nextCount);

            if (!showNotification) {
              setShowNotification(true);
            }
          }}
          id={incrementBtnDomId}
        >
          +
        </button>

        <button
          className="button"
          onClick={() => {
            const nextCount = clickCount - 1;
            setClickCount(nextCount);

            if (!showNotification) {
              setShowNotification(true);
            }
          }}
          id={decrementBtnDomId}
        >
          -
        </button>
      </section>
    </>
  );
}
