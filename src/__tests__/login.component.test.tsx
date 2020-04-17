/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import { render, cleanup } from "@testing-library/react";
import { Login } from "../components/Login/login.component";

afterEach(() => {
  cleanup();
});

it("renders", () => {
  const { ui } = makeComp();
  expect(1).toBe(1);
  render(ui);
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const LoginP = Login as ComponentType<Partial<{}>>;

function makeComp({ props = {} }: { props?: Partial<{}> } = {}) {
  return {
    ui: <LoginP {...props} />,
  };
}
