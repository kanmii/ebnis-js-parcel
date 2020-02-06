/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import { render, cleanup } from "@testing-library/react";
import { App } from "../components/App/app-component";
import {
  notificationDomId,
  incrementBtnDomId,
  decrementBtnDomId
} from "../components/App/app.dom";

afterEach(() => {
  cleanup();
});

it("renders", () => {
  const { ui } = makeComp();

  /**
   * When component is rendered
   */
  render(ui);

  /**
   * Then notification should not be visible
   */
  expect(document.getElementById(notificationDomId)).toBeNull();

  /**
   * When decrement button is clicked
   */
  const decrementNode = document.getElementById(
    decrementBtnDomId
  ) as HTMLElement;

  decrementNode.click();

  /**
   * Then notification should show error
   */
  const notificationNode = document.getElementById(
    notificationDomId
  ) as HTMLElement;

  expect(notificationNode.classList).toContain("is-danger");

  /**
   * And notification should show value of -1
   */
  expect(notificationNode.textContent).toBe("-1");

  /**
   * When decrement button is clicked again
   */
  decrementNode.click();

  /**
   * Then notification should still show error and value as -2
   */
  expect(notificationNode.classList).toContain("is-danger");
  expect(notificationNode.textContent).toBe("-2");

  /**
   * When increment button is clicked
   */
  const incrementNode = document.getElementById(
    incrementBtnDomId
  ) as HTMLElement;
  incrementNode.click();

  /**
   * Then notification should still show error and value as -1
   */
  expect(notificationNode.classList).toContain("is-danger");
  expect(notificationNode.textContent).toBe("-1");

  /**
   * When increment button is clicked again
   */
  incrementNode.click();

  /**
   * Then notification should show now warning and value as 0
   */
  expect(notificationNode.classList).toContain("is-warning");
  expect(notificationNode.textContent).toBe("0");

  /**
   * When increment button is clicked again
   */
  incrementNode.click();

  /**
   * Then notification should show now primary and value as 1
   */
  expect(notificationNode.classList).toContain("is-primary");
  expect(notificationNode.textContent).toBe("1");

  /**
   * When notification dismiss button is clicked
   */
  (notificationNode
    .getElementsByClassName("delete")
    .item(0) as HTMLElement).click();

  /**
   * Then notification should not be visible
   */
  expect(document.getElementById(notificationDomId)).toBeNull();

  /**
   * When increment button is clicked again
   */
  incrementNode.click();

  /**
   * Then notification should show now primary and value as 2
   */
  expect(
    (document.getElementById(notificationDomId) as HTMLElement).textContent
  ).toBe("2");
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const AppP = App as ComponentType<Partial<{}>>;

function makeComp({ props = {} }: { props?: Partial<{}> } = {}) {
  return {
    ui: <AppP {...props} />
  };
}
