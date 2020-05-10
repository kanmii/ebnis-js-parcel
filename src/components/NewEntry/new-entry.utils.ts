import { Reducer, Dispatch } from "react";
import {
  ExperienceFragment,
  ExperienceFragment_dataDefinitions,
} from "../../graphql/apollo-types/ExperienceFragment";
import immer, { Draft } from "immer";
import {
  DataTypes,
  CreateEntryInput,
  CreateDataObject,
  CreateExperienceInput,
  CreateDataDefinition,
} from "../../graphql/apollo-types/globalTypes";
import dateFnFormat from "date-fns/format";
import parseISO from "date-fns/parseISO";
import { CreateOfflineEntryMutationComponentProps } from "./new-entry.resolvers";
import { wrapReducer } from "../../logger";
import { isConnected } from "../../utils/connections";
import { scrollIntoView } from "../../utils/scroll-into-view";
import { scrollIntoViewNonFieldErrorDomId } from "./new-entry.dom";
import {
  UpdateExperiencesOnlineComponentProps,
  updateExperiencesOnlineEffectHelperFunc,
  CreateExperiencesComponentProps,
} from "../../utils/experience.gql.types";
import {
  StringyErrorPayload,
  parseStringError,
  FORM_CONTAINS_ERRORS_MESSAGE,
} from "../../utils/common-errors";
import {
  CreateEntryErrorFragment,
  CreateEntryErrorFragment_dataObjects,
} from "../../graphql/apollo-types/CreateEntryErrorFragment";
import {
  DetailedExperienceChildDispatchProps,
  ActionType as DetailedExperienceActionType,
} from "../DetailExperience/detail-experience.utils";
import {
  HasEffectsVal,
  ActiveVal,
  InActiveVal,
  ErrorsVal,
  StateValue,
} from "../../utils/types";
import {
  GenericGeneralEffect,
  GenericEffectDefinition,
} from "../../utils/effects";
import { isOfflineId } from "../../utils/offlines";
import {
  EntryConnectionFragment,
  EntryConnectionFragment_edges,
} from "../../graphql/apollo-types/EntryConnectionFragment";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import { createExperienceOnlineEffect } from "../NewExperience/new-experience.utils";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";

const NEW_LINE_REGEX = /\n/g;
export const ISO_DATE_FORMAT = "yyyy-MM-dd";
const ISO_DATE_TIME_FORMAT = ISO_DATE_FORMAT + "'T'HH:mm:ssXXX";

export enum ActionType {
  ON_FORM_FIELD_CHANGED = "@new-entry/on-form-field-changed",
  ON_CREATE_ENTRY_ERRORS = "@new-entry/set-create-entry-errors",
  DISMISS_NOTIFICATION = "@new-entry/unset-server-errors",
  ON_SUBMIT = "@new-entry/on-submit",
  ON_COMMON_ERROR = "@new-entry/on-common-error",
}

export function toISODateString(date: Date) {
  return dateFnFormat(date, ISO_DATE_FORMAT);
}

export function toISODatetimeString(date: Date | string) {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  const formattedDate = dateFnFormat(parsedDate, ISO_DATE_TIME_FORMAT);
  return formattedDate;
}

export function formObjToString(type: DataTypes, val: FormObjVal) {
  let toString = val;

  switch (type) {
    case DataTypes.DATE:
      toString = toISODateString(val as Date);
      break;

    case DataTypes.DATETIME:
      toString = toISODatetimeString(val as Date);
      break;

    case DataTypes.DECIMAL:
    case DataTypes.INTEGER:
      toString = (val || "0") + "";
      break;

    case DataTypes.SINGLE_LINE_TEXT:
      toString = val;
      break;

    case DataTypes.MULTI_LINE_TEXT:
      toString = (val as string).replace(NEW_LINE_REGEX, "\\\\n");
      break;
  }

  return (toString as string).trim().replace(/"/g, '\\"');
}

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer<StateMachine, Action>(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, (proxy) => {
        proxy.effects.general.value = StateValue.noEffect;
        delete proxy.effects.general[StateValue.hasEffects];

        switch (type) {
          case ActionType.ON_FORM_FIELD_CHANGED:
            handleFormFieldChangedAction(proxy, payload as FieldChangedPayload);
            break;

          case ActionType.ON_SUBMIT:
            handleSubmissionAction(proxy);
            break;

          case ActionType.ON_CREATE_ENTRY_ERRORS:
            handleOnCreateEntryErrors(
              proxy,
              payload as CreateEntryErrorFragment,
            );
            break;

          case ActionType.DISMISS_NOTIFICATION:
            proxy.states.submission.value = StateValue.inactive;
            break;

          case ActionType.ON_COMMON_ERROR:
            handleOnCommonErrorAction(proxy, payload as StringyErrorPayload);
            break;
        }
      });
    },

    // true,
  );

////////////////////////// EFFECTS SECTION ////////////////////////////

export const GENERIC_SERVER_ERROR = "Something went wrong - please try again.";

const createEntryEffect: DefCreateEntryEffect["func"] = (
  ownArgs,
  props,
  effectArgs,
) => {
  const { input } = ownArgs;

  if (isConnected()) {
    const { experience } = props;
    const experienceId = experience.id;

    if (isOfflineId(experienceId)) {
      syncOfflineExperienceEffect(experience, input, props, effectArgs);
    } else {
      createOnlineEntryEffect(input, props, effectArgs);
    }
  } else {
    createOfflineEntryEffect(input, props, effectArgs);
  }
};

function syncOfflineExperienceEffect(
  experience: ExperienceFragment,
  input: CreateEntryInput,
  props: Props,
  effectArgs: EffectArgs,
) {
  const { createExperiences, detailedExperienceDispatch } = props;
  const { dispatch } = effectArgs;

  const createExperienceInput = experienceToCreateInput(experience);
  createExperienceInput.entries = [input].concat(
    (createExperienceInput.entries ||
      // istanbul ignore next:
      []) as CreateEntryInput[],
  );

  createExperienceOnlineEffect(
    createExperienceInput,
    createExperiences,
    async (data) => {
      switch (data.key) {
        case "ExperienceSuccess":
          {
            await window.____ebnis.persistor.persist();
            const { experience, entriesErrors } = data;

            /**
             * 1. redirect to newly created experience
             * 2. deal with entriesErrors at newly created experience page
             */

            //
          }
          break;

        case "exception":
          dispatch({
            type: ActionType.ON_COMMON_ERROR,
            error: data.error,
          });
          break;

        case "CreateExperienceErrors":
          // tell detailedExperience that experience can not be created
          break;

        case "invalidResponse":
          dispatch({
            type: ActionType.ON_COMMON_ERROR,
            error: GENERIC_SERVER_ERROR,
          });
          break;
      }
    },
  );
}

function experienceToCreateInput(experience: ExperienceFragment) {
  const createExperienceInput = {
    clientId: experience.id,
    description: experience.description,
    title: experience.title,
    insertedAt: experience.insertedAt,
    updatedAt: experience.updatedAt,
    dataDefinitions: (experience.dataDefinitions as DataDefinitionFragment[]).map(
      (d) => {
        const input = {
          clientId: d.id,
          name: d.name,
          type: d.type,
        } as CreateDataDefinition;
        return input;
      },
    ),
  } as CreateExperienceInput;

  const createEntriesInput = entriesConnectionToCreateInput(experience.entries);

  if (createEntriesInput.length) {
    createExperienceInput.entries = createEntriesInput;
  }

  return createExperienceInput;
}

function entriesConnectionToCreateInput(entries: EntryConnectionFragment) {
  return ((entries.edges ||
    // istanbul ignore next:
    []) as EntryConnectionFragment_edges[]).map((edge) => {
    const entry = edge.node as EntryFragment;
    const input = {
      clientId: entry.id,
      experienceId: entry.experienceId,
      insertedAt: entry.insertedAt,
      updatedAt: entry.updatedAt,
      dataObjects: (entry.dataObjects as DataObjectFragment[]).map((d) => {
        const input = {
          clientId: d.id,
          data: d.data,
          definitionId: d.definitionId,
          insertedAt: d.insertedAt,
          updatedAt: d.updatedAt,
        } as CreateDataObject;
        return input;
      }),
    } as CreateEntryInput;

    return input;
  });
}

async function createOnlineEntryEffect(
  input: CreateEntryInput,
  props: Props,
  effectArgs: EffectArgs,
) {
  const {
    experience: { id: experienceId },
    updateExperiencesOnline,
    detailedExperienceDispatch,
  } = props;

  const { dispatch } = effectArgs;

  const inputs = [
    {
      experienceId,
      addEntries: [input],
    },
  ];

  updateExperiencesOnlineEffectHelperFunc({
    input: inputs,
    updateExperiencesOnline,
    onUpdateSuccess: async (experience) => {
      const { newEntries } = experience;

      if (newEntries && newEntries.length) {
        const entry0 = newEntries[0];

        if (entry0.__typename === "CreateEntryErrors") {
          const { errors } = entry0;
          dispatch({
            type: ActionType.ON_CREATE_ENTRY_ERRORS,
            ...errors,
          });

          return;
        }

        await window.____ebnis.persistor.persist();

        detailedExperienceDispatch({
          type: DetailedExperienceActionType.ON_NEW_ENTRY_CREATED,
          entry: entry0.entry,
        });

        return;
      }

      dispatch({
        type: ActionType.ON_COMMON_ERROR,
        error: GENERIC_SERVER_ERROR,
      });
    },
    onError: (error) => {
      dispatch({
        type: ActionType.ON_COMMON_ERROR,
        error: error || GENERIC_SERVER_ERROR,
      });
    },
  });
}

async function createOfflineEntryEffect(
  input: CreateEntryInput,
  props: Props,
  effectArgs: EffectArgs,
) {
  const {
    createOfflineEntry,
    experience: { id: experienceId },
    detailedExperienceDispatch,
  } = props;

  const { dispatch } = effectArgs;

  try {
    const response = await createOfflineEntry({
      variables: {
        experienceId,
        dataObjects: input.dataObjects as CreateDataObject[],
      },
    });

    const validResponse =
      response && response.data && response.data.createOfflineEntry;

    if (!validResponse) {
      dispatch({
        type: ActionType.ON_COMMON_ERROR,
        error: GENERIC_SERVER_ERROR,
      });

      return;
    }

    detailedExperienceDispatch({
      type: DetailedExperienceActionType.ON_NEW_ENTRY_CREATED,
      entry: validResponse.entry,
    });

    await window.____ebnis.persistor.persist();
  } catch (error) {
    dispatch({
      type: ActionType.ON_COMMON_ERROR,
      error,
    });
  }
}

interface CreateEntryEffectArgs {
  input: CreateEntryInput;
  onDone?: () => void;
}

type DefCreateEntryEffect = EffectDefinition<
  "createEntryEffect",
  CreateEntryEffectArgs
>;

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
  createEntryEffect,
  scrollToViewEffect,
};

////////////////////////// END EFFECTS SECTION ////////////////////////////

////////////////////////// STATE UPDATE SECTION ////////////////////////////

export function initState(experience: ExperienceFragment): StateMachine {
  const dataDefinitions = experience.dataDefinitions as ExperienceFragment_dataDefinitions[];

  const formFields = dataDefinitions.reduce((acc, definition, index) => {
    const value =
      definition.type === DataTypes.DATE ||
      definition.type === DataTypes.DATETIME
        ? new Date()
        : "";

    acc[index] = {
      context: { definition, value },
    };

    return acc;
  }, {} as FormFields);

  return {
    states: {
      submission: {
        value: StateValue.inactive,
      },
      form: {
        fields: formFields,
      },
    },
    context: { experience },
    effects: {
      general: {
        value: StateValue.noEffect,
      },
    },
  };
}

function handleSubmissionAction(proxy: DraftState) {
  const {
    context: { experience },
    states,
  } = proxy;

  states.submission.value = StateValue.active;
  const { dataDefinitions, id: experienceId } = experience;
  const {
    form: { fields },
  } = states;

  const dataObjects = dataObjectsFromFormValues(
    fields,
    dataDefinitions as ExperienceFragment_dataDefinitions[],
  );

  const effects = getRenderEffects(proxy);

  effects.push({
    key: "createEntryEffect",
    ownArgs: {
      input: {
        experienceId,
        dataObjects,
      },
    },
  });
}

function handleOnCreateEntryErrors(
  proxy: DraftState,
  payload: CreateEntryErrorFragment,
) {
  const {
    states: {
      form: { fields },
    },
  } = proxy;
  const { dataObjects } = payload as CreateEntryErrorFragment;

  if (!dataObjects) {
    handleOnCommonErrorAction(proxy, { error: GENERIC_SERVER_ERROR });
    return;
  }

  handleOnCommonErrorAction(proxy, { error: FORM_CONTAINS_ERRORS_MESSAGE });

  dataObjects.forEach((field) => {
    const {
      /* eslint-disable-next-line @typescript-eslint/no-unused-vars*/
      __typename,
      meta: { index },
      ...errors
    } = field as CreateEntryErrorFragment_dataObjects;

    const fieldState = fields[index];
    fieldState.context.errors = Object.entries(errors).filter((x) => !!x[1]);
  });
}

function handleOnCommonErrorAction(
  proxy: DraftState,
  payload: StringyErrorPayload,
) {
  const errors = parseStringError(payload.error);

  const commonErrorsState = {
    value: StateValue.errors,
    errors: {
      context: {
        errors,
      },
    },
  } as Submission;

  proxy.states.submission = {
    ...proxy.states.submission,
    ...commonErrorsState,
  };

  const effects = getRenderEffects(proxy);
  effects.push({
    key: "scrollToViewEffect",
    ownArgs: {
      id: scrollIntoViewNonFieldErrorDomId,
    },
  });
}

function getRenderEffects(proxy: DraftState) {
  const renderEffects = proxy.effects.general as GeneralEffect;
  renderEffects.value = StateValue.hasEffects;
  const effects: EffectsList = [];
  renderEffects.hasEffects = {
    context: {
      effects: effects,
    },
  };

  return effects;
}

function dataObjectsFromFormValues(
  formFields: StateMachine["states"]["form"]["fields"],
  dataDefinitions: ExperienceFragment_dataDefinitions[],
) {
  return Object.entries(formFields).reduce(
    (acc, [stringIndex, { context }]) => {
      delete context.errors;
      const index = Number(stringIndex);

      const definition = dataDefinitions[
        index
      ] as ExperienceFragment_dataDefinitions;

      const { type, id: definitionId } = definition;

      const data = `{"${type.toLowerCase()}":"${formObjToString(
        type,
        context.value,
      )}"}`;

      acc.push({
        definitionId,
        data,
      });

      return acc;
    },
    [] as CreateDataObject[],
  );
}

function handleFormFieldChangedAction(
  proxy: DraftState,
  payload: FieldChangedPayload,
) {
  const { fieldIndex, value } = payload;

  proxy.states.form.fields[fieldIndex].context.value = value;
}

////////////////////////// END STATE UPDATE SECTION /////////////////////

////////////////////////// TYPES SECTION ////////////////////////////

export interface CallerProps extends DetailedExperienceChildDispatchProps {
  experience: ExperienceFragment;
}

export type Props = CallerProps &
  UpdateExperiencesOnlineComponentProps &
  CreateOfflineEntryMutationComponentProps &
  CreateExperiencesComponentProps;

export type FormObjVal = Date | string | number;

// the keys are the indices of the field definitions and the values are the
// default values for each field data type e.g number for integer and date
// for date
export interface FormFields {
  [k: string]: FieldState;
}

export interface FieldState {
  context: {
    value: FormObjVal;
    definition: ExperienceFragment_dataDefinitions;
    errors?: [string, string][];
  };
}

export interface FieldComponentProps {
  formFieldName: string;
  dispatch: DispatchType;
  value: FormObjVal;
}

export type ToString = (val: FormObjVal) => string;

interface FieldChangedPayload {
  fieldIndex: string | number;
  value: FormObjVal;
}

interface FieldErrors {
  [k: string]: string;
}

type DraftState = Draft<StateMachine>;

type StateMachine = Readonly<GenericGeneralEffect<EffectType>> &
  Readonly<{
    context: {
      experience: Readonly<ExperienceFragment>;
    };
    states: Readonly<{
      submission: Submission;
      form: Readonly<{
        fields: FormFields;
      }>;
    }>;
  }>;

type Submission = Readonly<
  | SubmissionErrors
  | {
      value: ActiveVal;
    }
  | {
      value: InActiveVal;
    }
>;

export type SubmissionErrors = Readonly<{
  value: ErrorsVal;
  errors: Readonly<{
    context: {
      errors: string;
    };
  }>;
}>;

type Action =
  | { type: ActionType.ON_SUBMIT }
  | { type: ActionType.DISMISS_NOTIFICATION }
  | ({
      type: ActionType.ON_CREATE_ENTRY_ERRORS;
    } & CreateEntryErrorFragment)
  | ({
      type: ActionType.ON_FORM_FIELD_CHANGED;
    } & FieldChangedPayload)
  | ({
      type: ActionType.ON_COMMON_ERROR;
    } & StringyErrorPayload);

export type DispatchType = Dispatch<Action>;

interface EffectContext {
  effectsArgsObj: Props;
}

type EffectType = DefScrollToViewEffect | DefCreateEntryEffect;
type EffectsList = EffectType[];

export interface GeneralEffect {
  value: HasEffectsVal;
  hasEffects: {
    context: {
      effects: EffectsList;
    };
  };
}

interface EffectArgs {
  dispatch: DispatchType;
}

type EffectDefinition<
  Key extends keyof typeof effectFunctions,
  OwnArgs = {}
> = GenericEffectDefinition<EffectArgs, Props, Key, OwnArgs>;
