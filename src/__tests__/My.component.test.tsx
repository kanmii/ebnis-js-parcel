/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import { render, cleanup } from "@testing-library/react";
import { My } from "../components/My/my.component";
import {
  Props,
  reducer,
  initState,
  StateValue,
  ActionType,
  MyChildDispatchProps,
} from "../components/My/my.utils";
import {
  activateNewDomId,
  noExperiencesActivateNewDomId,
} from "../components/My/my.dom";

jest.mock("../components/Header/header.component", () => () => null);
jest.mock("../utils/global-window");

const mockNewExperienceId = "new-experience";
const mockActionType = require("../components/My/my.utils").ActionType;
jest.mock("../components/My/my.lazy", () => ({
  NewExperience: ({ myDispatch }: MyChildDispatchProps) => {
    return (
      <div
        id={mockNewExperienceId}
        onClick={() => {
          myDispatch({
            type: mockActionType.DEACTIVATE_NEW_EXPERIENCE,
          });
        }}
      />
    );
  },
}));

afterEach(() => {
  cleanup();
});

describe("component", () => {
  it("renders", () => {
    const { ui } = makeComp();
    render(ui);

    expect(document.getElementById(mockNewExperienceId)).toBeNull();

    // activate new using new button
    (document.getElementById(activateNewDomId) as HTMLElement).click();

    const newExperienceEl = document.getElementById(
      mockNewExperienceId,
    ) as HTMLElement;
    expect(newExperienceEl).not.toBeNull();
    newExperienceEl.click();
    expect(document.getElementById(mockNewExperienceId)).toBeNull();

    // activate new using 'no experiences' button
    (document.getElementById(
      noExperiencesActivateNewDomId,
    ) as HTMLElement).click();

    expect(document.getElementById(mockNewExperienceId)).not.toBeNull();
  });
});

describe("reducer", () => {
  test("deactivate new experience", () => {
    let state = initState({ experiences: [] } as Props);

    state = reducer(state, {
      type: ActionType.ACTIVATE_NEW_EXPERIENCE,
    });
    expect(state.states.newExperienceActivated.value).toBe(StateValue.active);

    state = reducer(state, {
      type: ActionType.DEACTIVATE_NEW_EXPERIENCE,
    });
    expect(state.states.newExperienceActivated.value).toBe(StateValue.inactive);
  });
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const MyP = My as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<{}> } = {}) {
  return {
    ui: <MyP {...props} experiences={[]} />,
  };
}
