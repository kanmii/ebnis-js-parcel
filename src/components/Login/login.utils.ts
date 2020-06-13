import { Reducer, Dispatch } from "react";
import { wrapReducer } from "../../logger";
import immer, { Draft } from "immer";
import {
  parseStringError,
  StringyErrorPayload,
  NOTHING_TO_SAVE_WARNING_MESSAGE,
  FORM_CONTAINS_ERRORS_MESSAGE,
  NO_CONNECTION_ERROR,
  GENERIC_SERVER_ERROR,
  FieldError,
} from "../../utils/common-errors";
import { scrollIntoView } from "../../utils/scroll-into-view";
import { LoginMutationComponentProps } from "../../utils/user.gql.types";
import { isConnected } from "../../utils/connections";
import { EbnisContextProps } from "../../utils/app-context";
import { windowChangeUrl, ChangeUrlType } from "../../utils/global-window";
import { MY_URL } from "../../utils/urls";
import { manageUserAuthentication } from "../../utils/manage-user-auth";
import {
  StateValue,
  InActiveVal,
  CommonErrorsVal,
  WarningVal,
  ValidVal,
  InvalidVal,
  InitialVal,
  UnChangedVal,
  ChangedVal,
  SubmissionVal,
  SuccessVal,
} from "../../utils/types";
import {
  GenericGeneralEffect,
  getGeneralEffects,
  GenericEffectDefinition,
  GenericHasEffect,
} from "../../utils/effects";

export enum ActionType {
  SUBMISSION = "@login/submission",
  FORM_ERRORS = "@login/form-errors",
  ON_COMMON_ERROR = "@login/on-common-error",
  CLOSE_SUBMIT_NOTIFICATION = "@login/close-submit-notification",
  FORM_CHANGED = "@login/form-changed",
  RESET_FORM_FIELDS = "@login/reset-form-fields",
  SERVER_FIELD_ERRORS = "@login/server-field-errors",
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
          case ActionType.FORM_CHANGED:
            handleFormChangedAction(proxy, payload as FormChangedPayload);
            break;

          case ActionType.SUBMISSION:
            handleSubmissionAction(proxy);
            break;

          case ActionType.ON_COMMON_ERROR:
            handleOnCommonErrorAction(proxy, payload as StringyErrorPayload);
            break;

          case ActionType.CLOSE_SUBMIT_NOTIFICATION:
            proxy.states.submission.value = StateValue.inactive;
            break;

          case ActionType.RESET_FORM_FIELDS:
            handleResetFormFieldsAction(proxy);
            break;
        }
      });
    },

    // true
  );

////////////////////////// EFFECTS SECTION /////////////////////////

const scrollToTopEffect: DefScrollToTopEffect["func"] = () => {
  scrollIntoView("");
};

type DefScrollToTopEffect = EffectDefinition<"scrollToTopEffect", {}>;

const loginEffect: DefLoginEffect["func"] = async (
  ownArgs,
  props,
  effectArgs,
) => {
  const { login, persistor } = props;

  const { input } = ownArgs;

  const { dispatch } = effectArgs;

  if (!isConnected()) {
    dispatch({
      type: ActionType.ON_COMMON_ERROR,
      error: NO_CONNECTION_ERROR,
    });

    return;
  }

  try {
    const response = await login({
      variables: {
        input,
      },
    });

    const validResponse = response && response.data && response.data.login;

    if (!validResponse) {
      dispatch({
        type: ActionType.ON_COMMON_ERROR,
        error: GENERIC_SERVER_ERROR,
      });

      return;
    }

    if (validResponse.__typename === "LoginError") {
      dispatch({
        type: ActionType.ON_COMMON_ERROR,
        error: validResponse.error,
      });

      return;
    } else {
      const { user } = validResponse;

      manageUserAuthentication(user);
      await persistor.persist();
      windowChangeUrl(MY_URL, ChangeUrlType.replace);
    }
  } catch (error) {
    dispatch({
      type: ActionType.ON_COMMON_ERROR,
      error,
    });
  }
};

type DefLoginEffect = EffectDefinition<
  "loginEffect",
  {
    input: FormInput;
  }
>;

export const effectFunctions = {
  scrollToTopEffect,
  loginEffect,
};

////////////////////////// END EFFECTS SECTION /////////////////////////

////////////////////////// STATE UPDATE SECTION /////////////////

export function initState(): StateMachine {
  return {
    effects: {
      general: {
        value: StateValue.noEffect,
      },
    },
    states: {
      submission: { value: StateValue.inactive },
      form: {
        fields: {
          email: {
            states: {
              value: StateValue.unchanged,
            },
          },
          password: {
            states: {
              value: StateValue.unchanged,
            },
          },
        },
        validity: {
          value: "initial",
        },
      },
    },
  };
}

function handleFormChangedAction(
  proxy: DraftState,
  payload: FormChangedPayload,
) {
  const { value: text, fieldName } = payload;
  const {
    states: {
      form: { fields },
    },
  } = proxy;

  const field = fields[fieldName] as FormField;
  const state = field.states as Draft<ChangedState>;
  state.value = StateValue.changed;
  state.changed = state.changed || {
    context: { formValue: text },
    states: {
      value: StateValue.initial,
    },
  };

  state.changed.context.formValue = text;
}

function handleSubmissionAction(proxy: DraftState) {
  const {
    states: { submission },
  } = proxy;

  const effects = getGeneralEffects<EffectType, DraftState>(proxy);
  submission.value = StateValue.inactive;

  const input = validateForm(proxy);
  const submissionErrorsState = submission as SubmissionCommonErrors;
  const submissionWarningState = submission as SubmissionWarning;

  if (
    submissionErrorsState.value === StateValue.commonErrors ||
    submissionWarningState.value === StateValue.warning
  ) {
    effects.push({
      key: "scrollToTopEffect",
      ownArgs: {},
    });
    return;
  }

  submission.value = StateValue.submitting;

  effects.push({
    key: "loginEffect",
    ownArgs: { input },
  });
}

function validateForm(proxy: DraftState): FormInput {
  const {
    states: {
      submission,
      form: { fields },
    },
  } = proxy;

  const {
    email: { states: emailState },

    password: { states: passwordState },
  } = fields;

  const submissionErrorState = submission as SubmissionCommonErrors;
  const submissionWarningState = submission as Draft<SubmissionWarning>;

  const input = {} as FormInput;
  let formUpdated = false;

  if (emailState.value === StateValue.changed) {
    const {
      changed: {
        context: { formValue },
        states: validityState0,
      },
    } = emailState;

    const value = formValue.trim();
    formUpdated = true;

    /* eslint-disable-next-line no-useless-escape*/
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (!regex.test(value)) {
      validateFormPutFieldErrorHelper(submissionErrorState, validityState0, [
        ["", "must be a valid email address"],
      ]);
    } else {
      input.email = value;
      validityState0.value = StateValue.valid;
    }
  }

  if (passwordState.value === StateValue.changed) {
    const {
      changed: {
        context: { formValue },
        states: validityState0,
      },
    } = passwordState;

    const value = formValue.trim();

    formUpdated = true;

    if (value.length < 4) {
      validateFormPutFieldErrorHelper(submissionErrorState, validityState0, [
        ["", "must be at least 4 characters long"],
      ]);
    } else {
      input.password = value;
      validityState0.value = StateValue.valid;
    }
  }

  if (!formUpdated) {
    submissionWarningState.value = StateValue.warning;
    submissionWarningState.warning = {
      context: {
        warning: NOTHING_TO_SAVE_WARNING_MESSAGE,
      },
    };
  }

  return input;
}

function validateFormPutFieldErrorHelper(
  submissionErrorState: Draft<SubmissionCommonErrors>,
  fieldState: ChangedState["changed"]["states"],
  errors: FieldError,
) {
  submissionErrorState.value = StateValue.commonErrors;

  submissionErrorState.commonErrors = {
    context: {
      errors: FORM_CONTAINS_ERRORS_MESSAGE,
    },
  };

  const validityState = fieldState as Draft<FieldInValid>;
  validityState.value = StateValue.invalid;
  validityState.invalid = {
    context: {
      errors,
    },
  };
}

function handleOnCommonErrorAction(
  proxy: DraftState,
  payload: StringyErrorPayload,
) {
  const errors = parseStringError(payload.error);

  const commonErrorsState = {
    value: StateValue.commonErrors,
    commonErrors: {
      context: {
        errors,
      },
    },
  } as Submission;

  proxy.states.submission = {
    ...proxy.states.submission,
    ...commonErrorsState,
  };

  const effects = getGeneralEffects(proxy);

  effects.push({
    key: "scrollToTopEffect",
    ownArgs: {},
  });
}

function handleResetFormFieldsAction(proxy: DraftState) {
  const {
    states: {
      submission,
      form: { fields },
    },
  } = proxy;

  submission.value = StateValue.inactive;

  Object.values(fields).forEach(({ states }) => {
    states.value = StateValue.unchanged;
    delete states[StateValue.changed];
  });
}

////////////////////////// END STATE UPDATE SECTION ////////////

////////////////////////// TYPES SECTION ////////////////////

type DraftState = Draft<StateMachine>;

export type StateMachine = Readonly<GenericGeneralEffect<EffectType>> &
  Readonly<{
    states: Readonly<{
      submission: Submission;
      form: Readonly<{
        validity: FormValidity;
        fields: Readonly<{
          email: FormField;
          password: FormField;
        }>;
      }>;
    }>;
  }>;

export type FormValidity = { value: InitialVal } | FormInValid;

interface FormInValid {
  value: InvalidVal;
  invalid: {
    context: {
      errors: FieldError;
    };
  };
}

////////////////////////// STRINGY TYPES SECTION ///////////

type Submission =
  | Readonly<{
      value: InActiveVal;
    }>
  | Submitting
  | SubmissionSuccess
  | SubmissionCommonErrors
  | SubmissionWarning;

type Submitting = Readonly<{
  value: SubmissionVal;
}>;

type SubmissionSuccess = Readonly<{
  value: SuccessVal;
}>;

export type SubmissionCommonErrors = Readonly<{
  value: CommonErrorsVal;
  commonErrors: Readonly<{
    context: {
      errors: string;
    };
  }>;
}>;

type SubmissionWarning = Readonly<{
  value: WarningVal;
  warning: Readonly<{
    context: Readonly<{
      warning: string;
    }>;
  }>;
}>;

export type FormField<FormValue = string> = Readonly<{
  states:
    | Readonly<{
        value: UnChangedVal;
      }>
    | ChangedState<FormValue>;
}>;

type ChangedState<FormValue = string> = Readonly<{
  value: ChangedVal;
  changed: Readonly<{
    context: Readonly<{
      formValue: FormValue;
    }>;
    states:
      | Readonly<{
          value: InitialVal;
        }>
      | Readonly<{
          value: ValidVal;
        }>
      | FieldInValid;
  }>;
}>;

type FieldInValid = Readonly<{
  value: InvalidVal;
  invalid: Readonly<{
    context: {
      errors: FieldError;
    };
  }>;
}>;

export type Action =
  | {
      type: ActionType.CLOSE_SUBMIT_NOTIFICATION;
    }
  | ({
      type: ActionType.ON_COMMON_ERROR;
    } & StringyErrorPayload)
  | {
      type: ActionType.SUBMISSION;
    }
  | {
      type: ActionType.FORM_ERRORS;
    }
  | ({
      type: ActionType.FORM_CHANGED;
    } & FormChangedPayload)
  | {
      type: ActionType.RESET_FORM_FIELDS;
    };

interface FormChangedPayload {
  value: string;
  fieldName: keyof StateMachine["states"]["form"]["fields"];
}

interface OtherErrorsPayload {
  errors: string;
}

export interface CallerProps {
  callerProp: boolean;
}

export type Props = CallerProps &
  LoginMutationComponentProps &
  Pick<EbnisContextProps, "persistor" | "cache">;

export interface EffectArgs {
  dispatch: Dispatch<Action>;
}

type EffectDefinition<
  Key extends keyof typeof effectFunctions,
  OwnArgs = {}
> = GenericEffectDefinition<EffectArgs, Props, Key, OwnArgs>;

type EffectType = DefLoginEffect | DefScrollToTopEffect;
export type EffectState = GenericHasEffect<EffectType>;
type EffectList = EffectType[];

interface FormInput {
  email: string;
  password: string;
}
