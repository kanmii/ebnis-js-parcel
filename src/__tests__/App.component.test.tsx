/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {ComponentType} from "react";
import {render, cleanup} from "@testing-library/react";
import {App} from "../components/App/app-component";

afterEach(() => {
  cleanup();
});


it("renders", () => {
  const {ui} = makeComp();

  render(ui);
  expect(true).toBe(true)
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const AppP = App as ComponentType<Partial<{}>>;

function makeComp({props = {}}: {props?: Partial<{}>} = {}) {
  return {
    ui: <AppP {...props} />
  };
}
