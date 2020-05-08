/* eslint-disable @typescript-eslint/no-explicit-any */
import { MUTATION_NAME_createOfflineEntry } from "../apollo/resolvers";
import {
  newEntryResolvers,
  CreateOfflineEntryMutationVariables,
} from "../components/NewEntry/new-entry.resolvers";
import { upsertExperienceWithEntry } from "../components/NewEntry/new-entry.injectables";
import { isOfflineId, makeOfflineId } from "../utils/offlines";
import {
  getUnsyncedExperience,
  writeUnsyncedExperience,
} from "../apollo/unsynced-ledger";

jest.mock("../components/NewEntry/new-entry.injectables");
const mockUpsertExperienceWithEntry = upsertExperienceWithEntry as jest.Mock;

jest.mock("../apollo/unsynced-ledger");
const mockGetUnsyncedExperience = getUnsyncedExperience as jest.Mock;
const mockWriteUnsyncedExperience = writeUnsyncedExperience as jest.Mock;

const createOfflineEntryMutationResolver =
  newEntryResolvers.Mutation[MUTATION_NAME_createOfflineEntry];

const mockCache = jest.fn();
const context = {
  cache: mockCache,
} as any;

afterEach(() => {
  jest.resetAllMocks();
});

it("online experience/creates entry/has unsynced", () => {
  mockGetUnsyncedExperience.mockReturnValue({});

  const variables = {
    experienceId: "1",
    dataObjects: [{}],
  } as CreateOfflineEntryMutationVariables;

  expect(mockUpsertExperienceWithEntry).not.toHaveBeenCalled();
  expect(mockWriteUnsyncedExperience).not.toHaveBeenCalled();

  const {
    entry: { id, dataObjects },
  } = createOfflineEntryMutationResolver(null, variables, context);

  expect(mockUpsertExperienceWithEntry).toHaveBeenCalled();
  expect(isOfflineId(id));
  expect(isOfflineId(dataObjects[0].id));
  expect(mockWriteUnsyncedExperience.mock.calls[0]).toEqual([
    "1",
    {
      newEntries: true,
    },
  ]);
});

it("offline experience/creates entry/no unsynced", () => {
  mockGetUnsyncedExperience.mockReturnValue(null);
  const id = makeOfflineId(1);

  const variables = {
    experienceId: id,
    dataObjects: [{}],
  } as CreateOfflineEntryMutationVariables;

  createOfflineEntryMutationResolver(null, variables, context);

  expect(mockWriteUnsyncedExperience).not.toHaveBeenCalled();
  expect(mockUpsertExperienceWithEntry).toHaveBeenCalled();
});
