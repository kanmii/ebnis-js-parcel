/* istanbul ignore file */
import { fireEvent } from "@testing-library/react";

export function fillField(element: Element, value: string) {
  fireEvent.change(element, {
    target: { value },
  });
}

