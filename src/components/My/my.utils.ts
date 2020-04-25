import { Reducer, Dispatch } from "react";
import { wrapReducer } from "../../logger";
import immer, { Draft } from "immer";

export enum ActionType {
  ACTIVATE_NEW_EXPERIENCE = "@my/activate-new-experience",
  DEACTIVATE_NEW_EXPERIENCE = "@my/deactivate-new-experience",
}

export const StateValue = {
  inactive: "inactive" as InActiveVal,
  active: "active" as ActiveVal,
};

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, (proxy) => {
        switch (type) {
          case ActionType.ACTIVATE_NEW_EXPERIENCE:
            handleActivateNewExperienceAction(proxy);
            break;

          case ActionType.DEACTIVATE_NEW_EXPERIENCE:
            handleDeactivateNewExperienceAction(proxy);
            break;
        }
      });
    },
    // true,
  );

////////////////////////// STATE UPDATE SECTION ////////////////////////////

export function initState(): StateMachine {
  return {
    states: {
      newExperienceActivated: {
        value: StateValue.inactive,
      },
    },
  };
}

function handleActivateNewExperienceAction(proxy: DraftState) {
  proxy.states.newExperienceActivated.value = StateValue.active;
}

function handleDeactivateNewExperienceAction(proxy: StateMachine) {
  proxy.states.newExperienceActivated.value = StateValue.inactive;
}

////////////////////////// END STATE UPDATE SECTION //////////////////////

type DraftState = Draft<StateMachine>;

export interface StateMachine {
  readonly states: {
    readonly newExperienceActivated:
      | {
          value: InActiveVal;
        }
      | {
          value: ActiveVal;
        };
  };
}

////////////////////////// STRINGY TYPES SECTION ///////////
type InActiveVal = "inactive";
type ActiveVal = "active";
////////////////////////// END STRINGY TYPES SECTION /////////

type Action =
  | {
      type: ActionType.ACTIVATE_NEW_EXPERIENCE;
    }
  | {
      type: ActionType.DEACTIVATE_NEW_EXPERIENCE;
    };

export type DispatchType = Dispatch<Action>;

export type Props = {};
