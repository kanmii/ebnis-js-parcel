import { Reducer, Dispatch } from "react";
import { wrapReducer } from "../../logger";
import { RouteChildrenProps, match } from "react-router-dom";
import { DetailExperienceRouteMatch } from "../../utils/urls";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { isOfflineId } from "../../utils/offlines";
import { getUnsyncedExperience } from "../../apollo/unsynced-ledger";
import immer, { Draft } from "immer";
import dateFnFormat from "date-fns/format";
import parseISO from "date-fns/parseISO";
import { ActiveVal, InActiveVal } from "../../utils/types";
import {
  GenericGeneralEffect,
  getGeneralEffects,
  GenericEffectDefinition,
} from "../../utils/effects";
import { scrollDocumentToTop } from "./detail-experience.injectables";
import { StateValue } from "../../utils/types";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import {
  getSyncingExperience,
  putOrRemoveSyncingExperience,
} from "../NewExperience/new-experience.resolvers";
import {
  replaceOrRemoveExperiencesInGetExperiencesMiniQuery,
  purgeExperiencesFromCache,
} from "../../apollo/update-get-experiences-mini-query";
import { EntryConnectionFragment_edges } from "../../graphql/apollo-types/EntryConnectionFragment";
import {
  CreateEntryErrorFragment,
  CreateEntryErrorFragment_dataObjects,
} from "../../graphql/apollo-types/CreateEntryErrorFragment";
import { writeSyncEntriesErrorsLedger } from "../../apollo/sync-entries-errors-ledger";

export enum ActionType {
  TOGGLE_NEW_ENTRY_ACTIVE = "@detailed-experience/deactivate-new-entry",
  ON_NEW_ENTRY_CREATED_OR_OFFLINE_EXPERIENCE_SYNCED = "@detailed-experience/on-new-entry-created/offline-experience-synced",
  ON_CLOSE_NEW_ENTRY_CREATED_NOTIFICATION = "@detailed-experience/on-close-new-entry-created-notification",
  SET_TIMEOUT = "@detailed-experience/set-timeout",
  ON_CLOSE_ENTRIES_ERRORS_NOTIFICATION = "@detailed-experience/on-close-entries-errors-notification",
}

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, (proxy) => {
        proxy.effects.general.value = StateValue.noEffect;
        delete proxy.effects.general[StateValue.hasEffects];

        switch (type) {
          case ActionType.TOGGLE_NEW_ENTRY_ACTIVE:
            handleToggleNewEntryActiveAction(proxy);
            break;

          case ActionType.ON_NEW_ENTRY_CREATED_OR_OFFLINE_EXPERIENCE_SYNCED:
            handleOnNewEntryCreatedOrOfflineExperienceSynced(
              proxy,
              payload as OnNewEntryCreatedOrOfflineExperienceSyncedPayload,
            );
            break;

          case ActionType.ON_CLOSE_NEW_ENTRY_CREATED_NOTIFICATION:
            handleOnCloseNewEntryCreatedNotification(proxy);
            break;

          case ActionType.SET_TIMEOUT:
            handleSetTimeout(proxy, payload as SetTimeoutPayload);
            break;

          case ActionType.ON_CLOSE_ENTRIES_ERRORS_NOTIFICATION:
            handleOnCloseEntriesErrorsNotification(proxy);
            break;
        }
      });
    },
    // true,
  );

////////////////////////// STATE UPDATE SECTION ////////////////////////////
export function initState(props: Props): StateMachine {
  return {
    context: {},
    effects: {
      general: {
        value: StateValue.hasEffects,
        hasEffects: {
          context: {
            effects: [
              {
                key: "purgeMatchingOfflineExperienceEffect",
                ownArgs: {},
              },
            ],
          },
        },
      },
    },
    states: {
      newEntryActive: {
        value: StateValue.inactive,
      },
      notification: {
        value: StateValue.inactive,
      },
      newEntryCreated: {
        value: StateValue.inactive,
      },
      entriesErrors: {
        value: StateValue.inactive,
      },
    },
  };
}

function handleToggleNewEntryActiveAction(proxy: DraftStateMachine) {
  const { states } = proxy;
  const {
    newEntryActive: { value },
  } = states;
  states.newEntryActive.value =
    value === StateValue.active ? StateValue.inactive : StateValue.active;
}

function handleOnNewEntryCreatedOrOfflineExperienceSynced(
  proxy: DraftStateMachine,
  payload: OnNewEntryCreatedOrOfflineExperienceSyncedPayload,
) {
  const { states, context } = proxy;
  const {
    newEntryActive,
    notification,
    newEntryCreated,
    entriesErrors,
  } = states;
  newEntryActive.value = StateValue.inactive;
  notification.value = StateValue.inactive;

  const effects = getGeneralEffects<EffectType, DraftStateMachine>(proxy);

  effects.push({
    key: "scrollDocToTopEffect",
    ownArgs: {},
  });

  const { mayBeNewEntry, mayBeEntriesErrors } = payload;

  // istanbul ignore else:
  if (mayBeNewEntry) {
    effects.push({
      key: "autoCloseNotificationEffect",
      ownArgs: {
        timeoutId: context.autoCloseNotificationTimeoutId,
      },
    });

    const newEntryState = newEntryCreated as Draft<NewEntryCreatedNotification>;
    newEntryState.value = StateValue.active;

    newEntryState.active = {
      context: {
        message: `New entry created on: ${formatDatetime(
          mayBeNewEntry.updatedAt,
        )}`,
      },
    };
  }

  // istanbul ignore else:
  if (mayBeEntriesErrors) {
    const values = {} as SyncEntriesErrors;

    const entriesErrorsState = entriesErrors as Draft<
      EntriesErrorsNotification
    >;

    entriesErrorsState.value = StateValue.active;
    entriesErrorsState.active = {
      context: {
        errors: values,
      },
    };

    effects.push({
      key: "putEntriesErrorsInLedgerEffect",
      ownArgs: values,
    });

    mayBeEntriesErrors.forEach((entryError) => {
      const {
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars*/
        __typename,
        meta: { clientId },
        dataObjects,
        ...otherErrors
      } = entryError;

      const errors: EntryErrorForNotification = [];

      // istanbul ignore else:
      if (dataObjects) {
        dataObjects.forEach((d) => {
          const {
            /* eslint-disable-next-line @typescript-eslint/no-unused-vars*/
            __typename,
            meta: { index },
            ...otherDataErrors
          } = d as CreateEntryErrorFragment_dataObjects;

          const dataErrors: [string, string][] = [];

          Object.entries(otherDataErrors).forEach(([k, v]) => {
            if (v) {
              dataErrors.push([k, v]);
            }
          });

          errors.push([index + 1, dataErrors]);
        });
      }

      Object.entries(otherErrors).forEach(([k, v]) => {
        if (v) {
          errors.push(["", [[k, v]]]);
        }
      });

      values[clientId as string] = errors;
    });
  }
}

function handleOnCloseNewEntryCreatedNotification(proxy: DraftStateMachine) {
  proxy.states.newEntryCreated.value = StateValue.inactive;
}

function handleOnCloseEntriesErrorsNotification(proxy: DraftStateMachine) {
  proxy.states.entriesErrors.value = StateValue.inactive;
}

function handleSetTimeout(
  proxy: DraftStateMachine,
  payload: SetTimeoutPayload,
) {
  const { context } = proxy;
  const { id } = payload;
  context.autoCloseNotificationTimeoutId = id;
}
////////////////////////// END STATE UPDATE ////////////////////////////

////////////////////////// EFFECTS SECTION ////////////////////////////
const scrollDocToTopEffect: DefScrollDocToTopEffect["func"] = () => {
  scrollDocumentToTop();
};

type DefScrollDocToTopEffect = EffectDefinition<"scrollDocToTopEffect">;

const autoCloseNotificationEffect: DefAutoCloseNotificationEffect["func"] = (
  ownArgs,
  _,
  effectArgs,
) => {
  const { dispatch } = effectArgs;
  const { timeoutId } = ownArgs;

  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  const id = setTimeout(() => {
    dispatch({
      type: ActionType.ON_CLOSE_NEW_ENTRY_CREATED_NOTIFICATION,
    });
  }, 10000);

  dispatch({
    type: ActionType.SET_TIMEOUT,
    id,
  });
};

type DefAutoCloseNotificationEffect = EffectDefinition<
  "autoCloseNotificationEffect",
  {
    timeoutId?: NodeJS.Timeout;
  }
>;

const purgeMatchingOfflineExperienceEffect: DefPurgeMatchingOfflineExperienceEffect["func"] = (
  _,
  props,
  effectArgs,
) => {
  const {
    experience: { id, entries },
  } = props;

  const { dispatch } = effectArgs;

  const ledger = getSyncingExperience(id);

  // istanbul ignore else
  if (ledger) {
    const { offlineExperienceId, newEntryClientId, entriesErrors } = ledger;

    replaceOrRemoveExperiencesInGetExperiencesMiniQuery({
      [offlineExperienceId]: null,
    });

    putOrRemoveSyncingExperience(id);

    purgeExperiencesFromCache([
      offlineExperienceId,
      "DataObjectErrorMeta:null",
    ]);

    window.____ebnis.persistor.persist();

    const newEntryEdge = (entries.edges as EntryConnectionFragment_edges[]).find(
      (edge) => {
        const { id, clientId } = edge.node as EntryFragment;
        return !isOfflineId(id) && clientId === newEntryClientId;
      },
    );

    dispatch({
      type: ActionType.ON_NEW_ENTRY_CREATED_OR_OFFLINE_EXPERIENCE_SYNCED,
      mayBeNewEntry: newEntryEdge && newEntryEdge.node,
      mayBeEntriesErrors: entriesErrors,
    });
  }
};

type DefPurgeMatchingOfflineExperienceEffect = EffectDefinition<
  "purgeMatchingOfflineExperienceEffect"
>;

const putEntriesErrorsInLedgerEffect: DefPutEntriesErrorsInLedgerEffect["func"] = (
  ownArgs,
) => {
  writeSyncEntriesErrorsLedger(ownArgs);
};

type DefPutEntriesErrorsInLedgerEffect = EffectDefinition<
  "putEntriesErrorsInLedgerEffect",
  SyncEntriesErrors
>;

export const effectFunctions = {
  scrollDocToTopEffect,
  autoCloseNotificationEffect,
  purgeMatchingOfflineExperienceEffect,
  putEntriesErrorsInLedgerEffect,
};
////////////////////////// END EFFECTS SECTION ////////////////////////////

////////////////////////// HELPER FUNCTIONS ////////////////////////////

export const DISPLAY_DATE_FORMAT_STRING = "dd/MM/yyyy";
export const DISPLAY_TIME_FORMAT_STRING = " HH:mm";
const DISPLAY_DATETIME_FORMAT_STRING =
  DISPLAY_DATE_FORMAT_STRING + DISPLAY_TIME_FORMAT_STRING;

export function formatDatetime(date: Date | string) {
  date =
    typeof date === "string"
      ? parseISO(date)
      : // istanbul ignore next:
        date;
  return dateFnFormat(date, DISPLAY_DATETIME_FORMAT_STRING);
}

export function getOnlineStatus<T extends { id: string }>(experience: T) {
  const { id } = experience;
  const isOffline = isOfflineId(experience.id);
  const hasUnsaved = getUnsyncedExperience(id);
  const isPartOffline = !isOffline && !!hasUnsaved;
  return { isOffline, isPartOffline };
}

////////////////////////// END HELPER FUNCTIONS ////////////////////////////

type DraftStateMachine = Draft<StateMachine>;

export type StateMachine = GenericGeneralEffect<EffectType> &
  Readonly<{
    context: StateContext;
  }> &
  Readonly<{
    states: Readonly<{
      newEntryActive: Readonly<
        | {
            value: ActiveVal;
          }
        | {
            value: InActiveVal;
          }
      >;

      newEntryCreated: Readonly<
        | {
            value: InActiveVal;
          }
        | NewEntryCreatedNotification
      >;

      entriesErrors: Readonly<
        | {
            value: InActiveVal;
          }
        | EntriesErrorsNotification
      >;

      notification: Readonly<
        | {
            value: InActiveVal;
          }
        | NotificationActive
      >;
    }>;
  }>;

type EntriesErrorsNotification = Readonly<{
  value: ActiveVal;
  active: {
    context: {
      errors: SyncEntriesErrors;
    };
  };
}>;

export interface SyncEntriesErrors {
  [offlineEntryClientId: string]: EntryErrorForNotification;
}

// [index/label, [errorKey, errorValue][]][]
export type EntryErrorForNotification = [string | number, [string, string][]][];

type NewEntryCreatedNotification = Readonly<{
  value: ActiveVal;
  active: Readonly<{
    context: Readonly<{
      message: string;
    }>;
  }>;
}>;

type StateContext = Readonly<{
  autoCloseNotificationTimeoutId?: NodeJS.Timeout;
}>;

type NotificationActive = Readonly<{
  value: ActiveVal;
  active: Readonly<{
    context: Readonly<{
      message: string;
    }>;
  }>;
}>;

export type CallerProps = RouteChildrenProps<DetailExperienceRouteMatch>;

export type Props = CallerProps & {
  experience: ExperienceFragment;
};
export type Match = match<DetailExperienceRouteMatch>;

type Action =
  | {
      type: ActionType.TOGGLE_NEW_ENTRY_ACTIVE;
    }
  | ({
      type: ActionType.ON_NEW_ENTRY_CREATED_OR_OFFLINE_EXPERIENCE_SYNCED;
    } & OnNewEntryCreatedOrOfflineExperienceSyncedPayload)
  | {
      type: ActionType.ON_CLOSE_NEW_ENTRY_CREATED_NOTIFICATION;
    }
  | ({
      type: ActionType.SET_TIMEOUT;
    } & SetTimeoutPayload)
  | {
      type: ActionType.ON_CLOSE_ENTRIES_ERRORS_NOTIFICATION;
    };

interface OnNewEntryCreatedOrOfflineExperienceSyncedPayload {
  mayBeNewEntry?: EntryFragment | null;
  mayBeEntriesErrors?: CreateEntryErrorFragment[] | null;
}

interface SetTimeoutPayload {
  id?: NodeJS.Timeout;
}

type DispatchType = Dispatch<Action>;

export interface DetailedExperienceChildDispatchProps {
  detailedExperienceDispatch: DispatchType;
}

export interface EffectArgs {
  dispatch: DispatchType;
}

export interface EffectArgs {
  dispatch: DispatchType;
}

type EffectDefinition<
  Key extends keyof typeof effectFunctions,
  OwnArgs = {}
> = GenericEffectDefinition<EffectArgs, Props, Key, OwnArgs>;

type EffectType =
  | DefScrollDocToTopEffect
  | DefAutoCloseNotificationEffect
  | DefPurgeMatchingOfflineExperienceEffect
  | DefPutEntriesErrorsInLedgerEffect;
type EffectList = EffectType[];
