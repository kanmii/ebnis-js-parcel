/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import { render, cleanup } from "@testing-library/react";
import { My } from "../components/My/my.component";
import { Props } from "../components/My/my.utils";
import { activateNewExperienceDomId } from "../components/My/my.dom";

jest.mock("../components/Header/header.component", () => () => null);
jest.mock("../utils/global-window");

const mockNewExperienceId = "new-experience";
jest.mock("../components/My/my.lazy", () => ({
  NewExperience: () => <div id={mockNewExperienceId} />,
}));

afterEach(() => {
  cleanup();
});

it("renders", () => {
  const { ui } = makeComp();
  render(ui);

  expect(document.getElementById(mockNewExperienceId)).toBeNull();
  (document.getElementById(activateNewExperienceDomId) as HTMLElement).click()
  expect(document.getElementById(mockNewExperienceId)).not.toBeNull();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const MyP = My as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<{}> } = {}) {
  return {
    ui: <MyP {...props} />,
  };
}
