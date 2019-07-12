import {
  GetAllUnSavedQueryProps,
  GetUnsavedSummary,
  SavedAndUnsavedExperienceSummary,
} from "../../state/unsaved-resolvers";
import {
  UploadUnsavedExperiencesMutationProps,
  UploadAllUnsavedsMutationProps,
} from "../../graphql/upload-unsaveds.mutation";
import { CreateEntriesMutationGqlProps } from "../../graphql/create-entries.mutation";
import immer, { Draft } from "immer";
import { Reducer } from "react";
import { RouteComponentProps } from "@reach/router";
import {
  ExperienceFragment_fieldDefs,
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries_edges,
} from "../../graphql/apollo-types/ExperienceFragment";
import {
  UploadAllUnsavedsMutation,
  UploadAllUnsavedsMutation_saveOfflineExperiences,
  UploadAllUnsavedsMutation_createEntries,
} from "../../graphql/apollo-types/UploadAllUnsavedsMutation";
import { WithApolloClient } from "react-apollo";
import ApolloClient, { ApolloError } from "apollo-client";
import { Dispatch } from "react";
import { UploadUnsavedExperiencesExperienceErrorFragment } from "../../graphql/apollo-types/UploadUnsavedExperiencesExperienceErrorFragment";
import { CreateEntriesErrorFragment } from "../../graphql/apollo-types/CreateEntriesErrorFragment";
import { LayoutDispatchType } from "../Layout/utils";
import { InMemoryCache } from "apollo-cache-inmemory";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";

export interface OwnProps
  extends GetAllUnSavedQueryProps,
    RouteComponentProps,
    WithApolloClient<{}> {}

export interface Props
  extends OwnProps,
    UploadUnsavedExperiencesMutationProps,
    CreateEntriesMutationGqlProps,
    UploadAllUnsavedsMutationProps {}

export interface State {
  readonly hasUnsavedExperiencesUploadError?: boolean | null;
  readonly hasSavedExperiencesUploadError?: boolean | null;
  readonly allUploadSucceeded?: boolean;
  readonly tabs: { [k: number]: boolean };
  readonly uploading?: boolean;
  readonly serverError?: string | null;
  readonly savedExperiencesLen: number;
  readonly unsavedExperiencesLen: number;
  readonly unSavedCount: number;
  readonly savedExperiencesMap: ExperiencesIdsToObjectMap;
  readonly unsavedExperiencesMap: ExperiencesIdsToObjectMap;
  readonly shouldRedirect?: boolean;
  readonly atLeastOneUploadSucceeded?: boolean | null;
}

export function stateInitializerFn(getAllUnsaved?: GetUnsavedSummary) {
  if (!getAllUnsaved) {
    return {
      tabs: {},
      unsavedExperiencesMap: {},
      savedExperiencesMap: {},
    } as State;
  }

  const {
    savedExperiencesLen = 0,
    unsavedExperiencesLen = 0,
    unsavedExperiencesMap = {},
    savedExperiencesMap = {},
  } = getAllUnsaved;

  return {
    ...getAllUnsaved,

    tabs: {
      1: savedExperiencesLen !== 0,
      2: savedExperiencesLen === 0 && unsavedExperiencesLen !== 0,
    },
    unSavedCount: savedExperiencesLen + unsavedExperiencesLen,
    savedExperiencesMap,
    unsavedExperiencesMap,
    savedExperiencesLen,
    unsavedExperiencesLen,
  } as State;
}

export enum ActionType {
  toggleTab = "@components/upload-unsaved/toggle-tab",
  setUploading = "@components/upload-unsaved/set-uploading",
  onUploadResult = "@components/upload-unsaved/result",
  setServerError = "@components/upload-unsaved/set-server-error",
  removeServerErrors = "@components/upload-unsaved/remove-server-error",
  initStateFromProps = "@components/upload-unsaved/init-state-from-props",
  experienceDeleted = "@components/upload-unsaved/experience-deleted",
}

type Action =
  | [ActionType.toggleTab, number | string]
  | [ActionType.setUploading, boolean]
  | [ActionType.onUploadResult, State]
  | [ActionType.setServerError, ApolloError]
  | [ActionType.removeServerErrors]
  | [ActionType.initStateFromProps, GetUnsavedSummary]
  | [ActionType.experienceDeleted, DeleteActionPayload];

export type DispatchType = Dispatch<Action>;

export const reducer: Reducer<State, Action> = (prevState, [type, payload]) => {
  if (type === ActionType.onUploadResult) {
    return payload as State;
  }

  return immer(prevState, proxy => {
    switch (type) {
      case ActionType.initStateFromProps:
        {
          Object.entries(
            stateInitializerFn(payload as GetUnsavedSummary),
          ).forEach(([k, v]) => {
            proxy[k] = v;
          });
        }

        break;

      case ActionType.toggleTab:
        {
          proxy.tabs = { [payload as number]: true };
        }

        break;

      case ActionType.setUploading:
        {
          proxy.uploading = payload as boolean;
          proxy.serverError = null;
          proxy.hasUnsavedExperiencesUploadError = null;
          proxy.hasSavedExperiencesUploadError = null;
          proxy.atLeastOneUploadSucceeded = false;
        }

        break;

      case ActionType.setServerError:
        {
          proxy.uploading = false;
          proxy.hasUnsavedExperiencesUploadError = true;
          proxy.hasSavedExperiencesUploadError = true;

          const message = (payload as ApolloError).message;

          try {
            proxy.serverError = message;
          } catch (error) {
            proxy.serverError = message;
          }
        }

        break;

      case ActionType.removeServerErrors:
        {
          proxy.serverError = null;
        }

        break;

      case ActionType.experienceDeleted:
        {
          const { id, type } = payload as DeleteActionPayload;

          if (type === "unsaved") {
            delete proxy.unsavedExperiencesMap[id];
            proxy.hasUnsavedExperiencesUploadError = null;
            --proxy.unsavedExperiencesLen;
          } else {
            delete proxy.savedExperiencesMap[id];
            proxy.hasSavedExperiencesUploadError = null;
            --proxy.savedExperiencesLen;
          }

          if (proxy.unsavedExperiencesLen + proxy.savedExperiencesLen === 0) {
            proxy.shouldRedirect = true;
          }
        }

        break;
    }
  });
};

export function fieldDefToUnsavedData(
  value: ExperienceFragment_fieldDefs | null,
) {
  const { clientId, name, type } = value as ExperienceFragment_fieldDefs;

  return { clientId, name, type };
}

function entriesErrorsToMap(errors: CreateEntriesErrorFragment[]) {
  return errors.reduce(
    (acc, { error, clientId }) => {
      acc[clientId] = error;

      return acc;
    },

    {} as { [K: string]: string },
  );
}

function updateStateWithSavedExperiencesUploadResult(
  stateProxy: Draft<State>,
  createEntries: (UploadAllUnsavedsMutation_createEntries | null)[] | null,
) {
  stateProxy.hasSavedExperiencesUploadError = false;
  let noUploadSucceeded = true;

  if (!createEntries) {
    return noUploadSucceeded;
  }

  const { savedExperiencesMap } = stateProxy;

  createEntries.forEach(elm => {
    // istanbul ignore next: make typescript happy
    if (!elm) {
      stateProxy.hasSavedExperiencesUploadError = true;
      return;
    }

    const { errors, experienceId, entries = [] } = elm;
    if (entries.length > 0) {
      noUploadSucceeded = false;
    }

    const map = savedExperiencesMap[experienceId];
    map.newlySavedEntries = entries as ExperienceFragment_entries_edges_node[];

    map.unsavedEntries = replaceUnsavedEntriesWithSavedVersions(
      map.unsavedEntries,
      map.newlySavedEntries,
    );

    if (errors) {
      stateProxy.hasSavedExperiencesUploadError = true;
      map.didUploadSucceed = false;

      map.entriesErrors = entriesErrorsToMap(
        errors as CreateEntriesErrorFragment[],
      );
    } else if (map.didUploadSucceed !== false) {
      map.didUploadSucceed = true;
    }
  });

  return noUploadSucceeded;
}

function updateStateWithUnsavedExperiencesUploadResult(
  stateProxy: Draft<State>,
  saveOfflineExperiences:
    | (UploadAllUnsavedsMutation_saveOfflineExperiences | null)[]
    | null,
) {
  stateProxy.hasUnsavedExperiencesUploadError = false;
  let noUploadSucceeded = true;

  if (!saveOfflineExperiences) {
    return noUploadSucceeded;
  }

  const { unsavedExperiencesMap } = stateProxy;

  saveOfflineExperiences.forEach(elm => {
    // istanbul ignore next: make typescript happy
    if (!elm) {
      stateProxy.hasUnsavedExperiencesUploadError = true;
      return;
    }

    const { experience, entriesErrors, experienceError } = elm;

    let map = {} as ExperiencesIdsToObjectMap["k"];

    if (experienceError) {
      const { clientId } = experienceError;
      map = unsavedExperiencesMap[clientId as string];

      try {
        const [[k, v]] = Object.entries(JSON.parse(experienceError.error));

        map.experienceError = k + ": " + v;
      } catch (error) {
        map.experienceError = experienceError.error;
      }
    } else if (experience) {
      noUploadSucceeded = false;

      const { clientId } = experience;
      map = unsavedExperiencesMap[clientId as string];
      map.newlySavedExperience = experience;

      map.unsavedEntries = replaceUnsavedEntriesWithSavedVersions(
        map.unsavedEntries,
        (experience.entries.edges || []).map(
          edge =>
            (edge as ExperienceFragment_entries_edges)
              .node as ExperienceFragment_entries_edges_node,
        ),
      );

      if (entriesErrors) {
        map.entriesErrors = entriesErrorsToMap(
          entriesErrors as CreateEntriesErrorFragment[],
        );
      }
    }

    if (experienceError || entriesErrors) {
      map.didUploadSucceed = false;
      stateProxy.hasUnsavedExperiencesUploadError = true;
    } else if (map.didUploadSucceed !== false) {
      map.didUploadSucceed = true;
    }
  });

  return noUploadSucceeded;
}

function replaceUnsavedEntriesWithSavedVersions(
  unsavedEntries: EntryFragment[],
  savedEntries: EntryFragment[],
) {
  if (savedEntries.length === 0) {
    return unsavedEntries;
  }

  const savedEntriesMap = savedEntries.reduce(
    (acc, item) => {
      acc[item.clientId as string] = item;
      return acc;
    },
    {} as { [k: string]: EntryFragment },
  );

  return unsavedEntries.map(entry => {
    const saved = savedEntriesMap[entry.clientId as string];

    if (saved) {
      return saved;
    }

    return entry;
  });
}

export function onUploadResult(
  prevState: State,
  payload: UploadAllUnsavedsMutation | undefined | void,
) {
  return immer(prevState, proxy => {
    proxy.uploading = false;

    if (!payload) {
      return;
    }

    const { saveOfflineExperiences, createEntries } = payload;

    const noSuccess1 = updateStateWithUnsavedExperiencesUploadResult(
      proxy,
      saveOfflineExperiences,
    );

    const noSuccess2 = updateStateWithSavedExperiencesUploadResult(
      proxy,
      createEntries,
    );

    proxy.allUploadSucceeded = !(
      proxy.hasUnsavedExperiencesUploadError === true ||
      proxy.hasSavedExperiencesUploadError === true
    );

    proxy.atLeastOneUploadSucceeded = !(noSuccess1 && noSuccess2);
  });
}

export interface ExperiencesIdsToObjectMap {
  [k: string]: ExperienceObjectMap;
}

export interface ExperienceObjectMap extends SavedAndUnsavedExperienceSummary {
  didUploadSucceed?: boolean;
  experienceError?: UploadUnsavedExperiencesExperienceErrorFragment["error"];
  entriesErrors?: { [k: string]: string };
  newlySavedExperience?: ExperienceFragment;
  newlySavedEntries?: ExperienceFragment_entries_edges_node[];
}

export interface UploadResultPayloadThirdArg {
  cache: InMemoryCache;
  client: ApolloClient<{}>;
  layoutDispatch: LayoutDispatchType;
  result: UploadAllUnsavedsMutation | undefined | void;
}

interface DeleteActionPayload {
  id: string;
  type: SaveStatusType;
}

export type SaveStatusType = "saved" | "unsaved";
