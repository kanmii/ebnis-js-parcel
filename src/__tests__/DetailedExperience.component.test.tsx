/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import { render, cleanup, wait } from "@testing-library/react";
import { DetailExperience } from "../components/DetailExperience/detail-experience.component";
import {
  Props,
  ActionType,
  DetailedExperienceChildDispatchProps,
} from "../components/DetailExperience/detail-experience.utils";
import { DataTypes } from "../graphql/apollo-types/globalTypes";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import { EntryConnectionFragment } from "../graphql/apollo-types/EntryConnectionFragment";
import { scrollDocumentToTop } from "../components/DetailExperience/detail-experience.injectables";

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
          });
        }}
      />
    ),
  };
});

afterEach(() => {
  cleanup();
});

const defaultExperience = {
  id: "1",
  dataDefinitions: [
    {
      id: "1",
      name: "aa",
      type: DataTypes.INTEGER,
    },
  ],
  entries: {
    edges: [] as any,
  },
} as ExperienceFragment;

it("no entries", async () => {
  const { ui } = makeComp();
  render(ui);

  // no entries to display
  expect(getEntriesEl()).toBeNull();

  // new entry UI initially not visible
  expect(document.getElementById(mockNewEntryId)).toBeNull();

  getNoEntryEl().click();

  expect(mockScrollDocumentToTop).not.toHaveBeenCalled();

  // new entry UI now visible
  (document.getElementById(mockNewEntryId) as HTMLElement).click();
  expect(document.getElementById(mockNewEntryId)).toBeNull();
  await wait(() => true);
  expect(mockScrollDocumentToTop).toHaveBeenCalled();
});

it("with entries", () => {
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

  // expect(getEntriesEl()).toBeNull();
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
