/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import { render, cleanup, waitForElement } from "@testing-library/react";
import { App } from "../components/App/app-component";
import {
  notificationDomId,
  incrementBtnDomId,
  decrementBtnDomId,
} from "../components/App/app.dom";

afterEach(() => {
  cleanup();
});

it("renders", async () => {
  const { ui } = makeComp();

  /**
   * When component is rendered
   */
  render(ui);

  /**
   * Then fetched data should not be rendered
   */
  expect(document.getElementsByClassName("content")).toHaveLength(0);

  /**
   * But after a while, fetched data should be visible
   */
  const dataEls = await waitForElement(() => {
    return document.getElementsByClassName("content");
  });

  expect(dataEls).not.toHaveLength(0);

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
   * Then notification should show warning
   */
  const notificationNode = document.getElementById(
    notificationDomId
  ) as HTMLElement;

  expect(notificationNode.classList).toContain("notification--warning");

  /**
   * And notification should show value of 0
   */
  expect(notificationNode.textContent).toBe("0");

  /**
   * When decrement button is clicked again
   */
  decrementNode.click();

  /**
   * Then notification should show error and value as -1
   */
  expect(notificationNode.classList).toContain("notification--error");
  expect(notificationNode.textContent).toBe("-1");

  /**
   * When increment button is clicked
   */
  const incrementNode = document.getElementById(
    incrementBtnDomId
  ) as HTMLElement;
  incrementNode.click();

  /**
   * Then notification should warning and value as 0
   */
  expect(notificationNode.classList).toContain("notification--warning");
  expect(notificationNode.textContent).toBe("0");

  /**
   * When increment button is clicked again
   */
  incrementNode.click();

  /**
   * Then notification should show info and value as 1
   */
  expect(notificationNode.classList).toContain("notification--info");
  expect(notificationNode.textContent).toBe("1");

  /**
   * When increment button is clicked again
   */
  incrementNode.click();

  /**
   * When notification dismiss button is clicked
   */
  (notificationNode
    .getElementsByClassName("notification__delete")
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
   * Then notification should show info and value as 1
   */
  expect(notificationNode.classList).toContain("notification--info");
  expect(notificationNode.textContent).toBe("2");
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const AppP = App as ComponentType<Partial<{}>>;

function makeComp({ props = {} }: { props?: Partial<{}> } = {}) {
  return {
    ui: <AppP {...props} />,
  };
}
