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
import { scrollIntoView } from "../../utils/scroll-into-view";
import { StateValue } from "../../utils/types";
import { scrollIntoViewDomId } from "./detail-experience.dom";

export enum ActionType {
  TOGGLE_NEW_ENTRY_ACTIVE = "@detailed-experience/deactivate-new-entry",
  ON_NEW_ENTRY_CREATED = "@detailed-experience/on-new-entry-created",
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
            handleOnNewEntryCreated(proxy);
            break;
        }
      });
    },
    // true,
  );

////////////////////////// STATE UPDATE SECTION ////////////////////////////
export function initState(): StateMachine {
  return {
    effects: {
      general: {
        value: StateValue.noEffect,
      },
    },
    states: {
      newEntryActive: {
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

function handleOnNewEntryCreated(proxy: DraftStateMachine) {
  const { states } = proxy;
  const { newEntryActive } = states;
  newEntryActive.value = StateValue.inactive;

  const effects = getGeneralEffects<EffectType, DraftStateMachine>(proxy);
  effects.push({
    key: "scrollToViewEffect",
    ownArgs: {
      id: scrollIntoViewDomId,
    },
  });
}
////////////////////////// END STATE UPDATE ////////////////////////////

const scrollToViewEffect: DefScrollToViewEffect["func"] = ({ id }) => {
  scrollIntoView(id, {
    behavior: "smooth",
  });
};

type DefScrollToViewEffect = EffectDefinition<
  "scrollToViewEffect",
  {
    id: string;
  }
>;

export const effectFunctions = {
  scrollToViewEffect,
};

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
    states: Readonly<{
      newEntryActive: Readonly<
        | {
            value: ActiveVal;
          }
        | {
            value: InActiveVal;
          }
      >;
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
  | {
      type: ActionType.ON_NEW_ENTRY_CREATED;
    };

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
  OwnArgs
> = GenericEffectDefinition<EffectArgs, Props, Key, OwnArgs>;

type EffectType = DefScrollToViewEffect;
type EffectList = EffectType[];
