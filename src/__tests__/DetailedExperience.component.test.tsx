/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import { render, cleanup, waitForElement } from "@testing-library/react";
import { DetailExperience } from "../components/DetailExperience/detail-experience.component";
import {
  Props,
  ActionType,
  DetailedExperienceChildDispatchProps,
} from "../components/DetailExperience/detail-experience.utils";
import { EntryConnectionFragment } from "../graphql/apollo-types/EntryConnectionFragment";
import { scrollDocumentToTop } from "../components/DetailExperience/detail-experience.injectables";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import { notificationCloseId } from "../components/DetailExperience/detail-experience.dom";
import { act } from "react-dom/test-utils";
import { defaultExperience } from "../tests.utils";
import { makeOfflineId } from "../utils/offlines";

jest.mock("../components/DetailExperience/detail-experience.injectables");
const mockScrollDocumentToTop = scrollDocumentToTop as jest.Mock;

const mockNewEntryId = "aa";
const mockActionType = ActionType;
jest.mock("../components/DetailExperience/detail-experience.lazy", () => {
  return {
    NewEntry: ({
      detailedExperienceDispatch,
    }: DetailedExperienceChildDispatchProps) => (
      <div
        id={mockNewEntryId}
        onClick={() => {
          detailedExperienceDispatch({
            type: mockActionType.ON_NEW_ENTRY_CREATED,
            entry: {
              updatedAt: "2020-05-08T06:49:19Z",
            } as EntryFragment,
          });
        }}
      />
    ),
  };
});

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  cleanup();
  jest.clearAllTimers();
});

const timeout = 100000;
const entryOfflineClassName = "entry--is-danger";

it("no entries/entry added/auto close notification", async () => {
  const { ui } = makeComp();
  render(ui);

  // no entries to display
  expect(getEntriesEl()).toBeNull();

  // new entry UI initially not visible
  expect(document.getElementById(mockNewEntryId)).toBeNull();

  getNoEntryEl().click();

  expect(mockScrollDocumentToTop).not.toHaveBeenCalled();

  expect(getNotificationEl()).toBeNull();

  // new entry UI now visible: let's simulate new entry created
  const newEntryEl = await waitForElement(() => {
    return document.getElementById(mockNewEntryId) as HTMLElement;
  });

  newEntryEl.click();
  expect(document.getElementById(mockNewEntryId)).toBeNull();
  let notificationEl = await waitForElement(getNotificationEl);

  expect(mockScrollDocumentToTop).toHaveBeenCalled();

  notificationEl.click();
  expect(getNotificationEl()).toBeNull();

  // simulate auto close notification
  const newEntryToggleEl = getNewEntryTriggerEl();
  newEntryToggleEl.click();
  (document.getElementById(mockNewEntryId) as HTMLElement).click();
  await waitForElement(getNotificationEl); // exists

  act(() => {
    jest.advanceTimersByTime(timeout);
  });

  expect(getNotificationEl()).toBeNull();
});

it("with online entry", async () => {
  const { ui } = makeComp({
    props: {
      experience: {
        ...defaultExperience,
        entries: {
          edges: [
            {
              node: {
                id: "1",
                dataObjects: [
                  {
                    id: "1",
                    definitionId: "1",
                    data: `{"integer":1}`,
                  },
                ],
                updatedAt: "2020-05-08T01:40:07.160Z",
              },
            },
          ],
        } as EntryConnectionFragment,
      },
    },
  });
  render(ui);

  // we have an entry, no entry UI should not be visible
  expect(getNoEntryEl()).toBeNull();

  expect(document.getElementById(mockNewEntryId)).toBeNull();

  const newEntryToggleEl = getNewEntryTriggerEl();
  newEntryToggleEl.click();
  expect(document.getElementById(mockNewEntryId)).not.toBeNull();
  newEntryToggleEl.click();
  expect(document.getElementById(mockNewEntryId)).toBeNull();

  const entryEl = document.querySelector(".entry") as HTMLElement;

  expect(entryEl.classList).not.toContain(entryOfflineClassName);
});


it("with offline entry", () => {
  const id = makeOfflineId(1);

  const { ui } = makeComp({
    props: {
      experience: {
        ...defaultExperience,
        entries: {
          edges: [
            {
              node: {
                id,
                dataObjects: [
                  {
                    id,
                    definitionId: "1",
                    data: `{"integer":1}`,
                  },
                ],
                updatedAt: "2020-05-08T01:40:07.160Z",
              },
            },
          ],
        } as EntryConnectionFragment,
      },
    },
  });

  render(ui);
  const entryEl = document.querySelector(
    `.entry.${entryOfflineClassName}`,
  ) as HTMLElement;

  expect(entryEl.classList).toContain(entryOfflineClassName);
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const DetailExperienceP = DetailExperience as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  const experience = props.experience || defaultExperience;

  return {
    ui: <DetailExperienceP {...props} experience={experience} />,
  };
}

function getNoEntryEl() {
  return document
    .getElementsByClassName("no-entry-alert")
    .item(0) as HTMLElement;
}

function getEntriesEl() {
  return document.getElementsByClassName("entries").item(0) as HTMLElement;
}

function getNewEntryTriggerEl() {
  return document
    .getElementsByClassName("new-entry-trigger")
    .item(0) as HTMLElement;
}

function getNotificationEl() {
  return document.getElementById(notificationCloseId) as HTMLElement;
}
