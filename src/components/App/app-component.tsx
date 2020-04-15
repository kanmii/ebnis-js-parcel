import React, { useState, useEffect } from "react";
import makeClassNames from "classnames";
import "./app.styles.scss";
import {
  notificationDomId,
  incrementBtnDomId,
  decrementBtnDomId,
} from "./app.dom";
import Header from "../Header/header.component";

export function App() {
  const [state, setState] = useState<State>({
    showNotification: false,
    clickCount: 0,
    dataFetch: {
      value: "noRequest",
    },
  });

  useEffect(() => {
    (async function fetchData() {
      try {
        const data = await import("../../sample-fetch-data.json");

        setState((oldState) => {
          return {
            ...oldState,
            dataFetch: {
              value: "success",
              data: process.env.NODE_ENV === "test" ? data.default : data,
            },
          };
        });
      } catch (error) {
        setState((oldState) => {
          return {
            ...oldState,
            dataFetch: {
              value: "error",
              error: "Failed to fetch data",
            },
          };
        });
      }
    })();
  }, []);

  const {
    showNotification, //
    clickCount,
    dataFetch,
  } = state;

  return (
    <>
      <Header />

      {showNotification && (
        <div
          className={makeClassNames({
            notification: true,
            "notification--info": clickCount > 0,
            "notification--warning": clickCount === 0,
            "notification--error": clickCount < 0,
          })}
          id={notificationDomId}
        >
          <div
            className="notification__delete"
            onClick={() => {
              setState({ ...state, showNotification: false });
            }}
          />
          {clickCount}
        </div>
      )}

      <div className="buttons">
        <button
          className="button"
          onClick={() => {
            const nextCount = clickCount + 1;
            setState({ ...state, clickCount: nextCount });

            if (!showNotification) {
              setState({ ...state, showNotification: true });
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
            setState({ ...state, clickCount: nextCount });

            if (!showNotification) {
              setState({ ...state, showNotification: true });
            }
          }}
          id={decrementBtnDomId}
        >
          -
        </button>
      </div>

      <Data request={dataFetch} />
    </>
  );
}

function Data({ request }: { request: DataFetch }) {
  switch (request.value) {
    case "noRequest":
      return <div>Waiting to request data...</div>;
    case "requesting":
      return <div>Requesting data....</div>;
    case "error":
      return <div>Failed to fetch data</div>;
    case "success": {
      const { data } = request;

      return (
        <>
          {data.map((d, index) => {
            index += 1;

            return (
              <div key={index} className="content">
                <div>
                  <div>Message {index}:</div>
                  {d}
                </div>
              </div>
            );
          })}
        </>
      );
    }
  }
}

export default App;

interface State {
  readonly showNotification: boolean;
  readonly clickCount: number;
  readonly dataFetch: DataFetch;
}

type DataFetch =
  | {
      value: "noRequest";
    }
  | {
      value: "requesting";
    }
  | {
      value: "success";
      data: string[];
    }
  | {
      value: "error";
      error: string;
    };
