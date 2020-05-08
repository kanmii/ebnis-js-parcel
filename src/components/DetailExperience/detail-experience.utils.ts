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

export enum ActionType {
  TOGGLE_NEW_ENTRY_ACTIVE = "@detailed-experience/deactivate-new-entry",
  ON_NEW_ENTRY_CREATED = "@detailed-experience/on-new-entry-created",
  ON_CLOSE_NOTIFICATION = "@detailed-experience/on-close-notification",
  SET_TIMEOUT = "@detailed-experience/set-timeout",
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

          case ActionType.ON_NEW_ENTRY_CREATED:
            handleOnNewEntryCreated(proxy, payload as OnNewEntryCreatedPayload);
            break;

          case ActionType.ON_CLOSE_NOTIFICATION:
            handleOnCloseNotification(proxy);
            break;

          case ActionType.SET_TIMEOUT:
            handleSetTimeout(proxy, payload as SetTimeoutPayload);
            break;
        }
      });
    },
    // true,
  );

////////////////////////// STATE UPDATE SECTION ////////////////////////////
export function initState(): StateMachine {
  return {
    context: {},
    effects: {
      general: {
        value: StateValue.noEffect,
      },
    },
    states: {
      newEntryActive: {
        value: StateValue.inactive,
      },
      notification: {
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

function handleOnNewEntryCreated(
  proxy: DraftStateMachine,
  payload: OnNewEntryCreatedPayload,
) {
  const { states, context } = proxy;
  const { newEntryActive, notification } = states;
  const { entry } = payload;

  newEntryActive.value = StateValue.inactive;
  const notificationState = notification as Draft<NotificationActive>;
  notificationState.value = StateValue.active;
  notificationState.active = {
    context: {
      message: `New entry created on: ${formatDatetime(entry.updatedAt)}`,
    },
  };

  const effects = getGeneralEffects<EffectType, DraftStateMachine>(proxy);
  effects.push(
    {
      key: "scrollDocToTopEffect",
      ownArgs: {},
    },
    {
      key: "autoCloseNotificationEffect",
      ownArgs: {
        timeoutId: context.autoCloseNotificationTimeoutId,
      },
    },
  );
}

function handleOnCloseNotification(proxy: DraftStateMachine) {
  proxy.states.notification.value = StateValue.inactive;
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
      type: ActionType.ON_CLOSE_NOTIFICATION,
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

export const effectFunctions = {
  scrollDocToTopEffect,
  autoCloseNotificationEffect,
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

type StateMachine = GenericGeneralEffect<EffectType> &
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

      notification: Readonly<
        | {
            value: InActiveVal;
          }
        | NotificationActive
      >;
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
      type: ActionType.ON_NEW_ENTRY_CREATED;
    } & OnNewEntryCreatedPayload)
  | {
      type: ActionType.ON_CLOSE_NOTIFICATION;
    }
  | ({
      type: ActionType.SET_TIMEOUT;
    } & SetTimeoutPayload);

interface OnNewEntryCreatedPayload {
  entry: EntryFragment;
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

type EffectType = DefScrollDocToTopEffect | DefAutoCloseNotificationEffect;
type EffectList = EffectType[];
