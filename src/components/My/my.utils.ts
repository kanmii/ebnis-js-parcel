import { Reducer, Dispatch } from "react";
import { wrapReducer } from "../../logger";
import immer, { Draft } from "immer";
import { ExperienceMiniFragment } from "../../graphql/apollo-types/ExperienceMiniFragment";
import { WatchQueryFetchPolicy } from "apollo-client";
import fuzzysort from "fuzzysort";

export enum ActionType {
  ACTIVATE_NEW_EXPERIENCE = "@my/activate-new-experience",
  DEACTIVATE_NEW_EXPERIENCE = "@my/deactivate-new-experience",
  TOGGLE_SHOW_DESCRIPTION = "@my/toggle-show-description",
  TOGGLE_SHOW_OPTIONS_MENU = "@my/toggle-show-options-menu",
  CLOSE_ALL_OPTIONS_MENU = "@my/close-all-options-menu",
  SEARCH = "@my/search",
  CLEAR_SEARCH = "@my/clear-search",
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

          case ActionType.TOGGLE_SHOW_DESCRIPTION:
            handleToggleShowDescriptionAction(
              proxy,
              payload as ToggleDescriptionPayload,
            );
            break;

          case ActionType.TOGGLE_SHOW_OPTIONS_MENU:
            handleToggleShowOptionsMenuAction(
              proxy,
              payload as ToggleDescriptionPayload,
            );
            break;

          case ActionType.CLOSE_ALL_OPTIONS_MENU:
            handleCloseAllOptionsMenuAction(proxy);
            break;

          case ActionType.SEARCH:
            handleSearchAction(proxy, payload as SetSearchTextPayload);
            break;

          case ActionType.CLEAR_SEARCH:
            handleClearSearchAction(proxy);
            break;
        }
      });
    },
    // true,
  );

////////////////////////// STATE UPDATE SECTION ////////////////////////////

export function initState(props: Props): StateMachine {
  const { experiences } = props;

  return {
    context: {
      experiencesPrepared: prepareExperiencesForSearch(experiences),
    },

    states: {
      newExperienceActivated: {
        value: StateValue.inactive,
      },
      experiences: {},
      search: {
        value: StateValue.inactive,
      },
    },
  };
}

function prepareExperiencesForSearch(experiences: ExperienceMiniFragment[]) {
  return experiences.map(({ id, title }) => {
    return {
      id,
      title,
      target: fuzzysort.prepare(title) as Fuzzysort.Prepared,
    };
  });
}

function handleActivateNewExperienceAction(proxy: DraftState) {
  proxy.states.newExperienceActivated.value = StateValue.active;
}

function handleDeactivateNewExperienceAction(proxy: StateMachine) {
  proxy.states.newExperienceActivated.value = StateValue.inactive;
}

function handleToggleShowDescriptionAction(
  proxy: StateMachine,
  { id }: ToggleDescriptionPayload,
) {
  const {
    states: { experiences: experiencesState },
  } = proxy;

  const state = experiencesState[id] || ({} as ExperienceState);
  state.showingDescription = !state.showingDescription;
  state.showingOptionsMenu = false;
  experiencesState[id] = state;
}

function handleToggleShowOptionsMenuAction(
  proxy: StateMachine,
  { id }: ToggleDescriptionPayload,
) {
  const {
    states: { experiences: experiencesState },
  } = proxy;

  const state = experiencesState[id] || ({} as ExperienceState);
  state.showingOptionsMenu = !state.showingOptionsMenu;
  experiencesState[id] = state;
}

function handleCloseAllOptionsMenuAction(proxy: StateMachine) {
  const {
    states: { experiences: experiencesState },
  } = proxy;

  Object.values(experiencesState).forEach((state) => {
    state.showingOptionsMenu = false;
  });
}

function handleSearchAction(proxy: DraftState, payload: SetSearchTextPayload) {
  const { text } = payload;
  const {
    context: { experiencesPrepared },
    states: { search },
  } = proxy;

  const activeSearch = search as Draft<SearchActive>;
  activeSearch.value = StateValue.active;
  const active = activeSearch.active || makeDefaultSearchActive();

  const context = active.context;
  context.value = text;
  activeSearch.active = active;

  context.results = fuzzysort
    .go(text, experiencesPrepared, {
      key: "title",
    })
    .map((searchResult) => {
      const { obj } = searchResult;

      return {
        title: obj.title,
        id: obj.id,
      };
    });
}

export function makeDefaultSearchActive() {
  return {
    context: {
      value: "",
      results: [],
    },
  };
}

function handleClearSearchAction(proxy: DraftState) {
  const {
    states: { search },
  } = proxy;

  const state = search;

  if (search.value === StateValue.inactive) {
    return;
  } else {
    search.active = makeDefaultSearchActive();
    state.value = StateValue.inactive;
  }
}

////////////////////////// END STATE UPDATE SECTION //////////////////////

////////////////////////// HELPER FUNCTIONS /////////////////////

export function computeFetchPolicy(
  hasConnection: boolean,
): WatchQueryFetchPolicy {
  return hasConnection ? "cache-first" : "cache-only";
}

////////////////////////// END HELPER FUNCTIONS //////////////////////

type DraftState = Draft<StateMachine>;

export interface StateMachine {
  readonly context: {
    experiencesPrepared: ExperiencesSearchPrepared;
  };
  readonly states: {
    readonly newExperienceActivated:
      | {
          value: InActiveVal;
        }
      | {
          value: ActiveVal;
        };
    readonly experiences: ExperiencesMap;
    readonly search: SearchState;
  };
}

////////////////////////// STRINGY TYPES SECTION ///////////
type InActiveVal = "inactive";
type ActiveVal = "active";
////////////////////////// END STRINGY TYPES SECTION /////////

export type SearchState =
  | {
      value: InActiveVal;
    }
  | SearchActive;

export interface SearchActive {
  readonly value: ActiveVal;
  readonly active: {
    readonly context: {
      readonly value: string;
      readonly results: MySearchResult[];
    };
  };
}

interface MySearchResult {
  title: string;
  id: string;
}

type Action =
  | {
      type: ActionType.ACTIVATE_NEW_EXPERIENCE;
    }
  | {
      type: ActionType.DEACTIVATE_NEW_EXPERIENCE;
    }
  | ({
      type: ActionType.TOGGLE_SHOW_DESCRIPTION;
    } & ToggleDescriptionPayload)
  | ({
      type: ActionType.TOGGLE_SHOW_OPTIONS_MENU;
    } & ToggleDescriptionPayload)
  | {
      type: ActionType.CLOSE_ALL_OPTIONS_MENU;
    }
  | {
      type: ActionType.CLEAR_SEARCH;
    }
  | ({
      type: ActionType.SEARCH;
    } & SetSearchTextPayload);

interface ToggleDescriptionPayload {
  id: string;
}

interface SetSearchTextPayload {
  text: string;
}

export type DispatchType = Dispatch<Action>;

export interface MyChildDispatchProps {
  myDispatch: DispatchType;
}

export type Props = {
  experiences: ExperienceMiniFragment[];
};

export interface ExperiencesMap {
  [experienceId: string]: ExperienceState;
}

export interface ExperienceState {
  showingDescription: boolean;
  showingOptionsMenu: boolean;
}

export type ExperiencesSearchPrepared = {
  target: Fuzzysort.Prepared;
  title: string;
  id: string;
}[];
