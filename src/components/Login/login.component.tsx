import React, {
  useReducer,
  useCallback,
  MouseEvent,
  useContext,
  useLayoutEffect,
} from "react";
import Header from "../Header/header.component";
import "./login.styles.scss";
import {
  Props,
  effectFunctions,
  reducer,
  initState,
  ActionType,
  CallerProps,
  FormField,
} from "./login.utils";
import { FieldError } from "../../utils/common-errors";
import FormCtrlError from "../FormCtrlError/form-ctrl-error.component";
import {
  emailInputId,
  passwordInputId,
  passwordErrorId,
  emailErrorId,
  submitId,
  resetId,
  notificationId,
  LOGIN_PAGE_TITLE,
} from "./login.dom";
import { useLoginMutation } from "../../utils/user.gql.types";
import makeClassNames from "classnames";
import { warningClassName, errorClassName } from "../../utils/utils.dom";
import { EbnisAppContext } from "../../utils/app-context";
import { setUpRoutePage } from "../../utils/global-window";
import { StateValue, InputChangeEvent } from "../../utils/types";
import { useRunEffects } from "../../utils/use-run-effects";
import { formFieldErrorClass } from "../../utils/utils.dom";

export function Login(props: Props) {
  const [stateMachine, dispatch] = useReducer(reducer, undefined, initState);

  const {
    states: {
      submission: submissionState,
      form: {
        fields: { email: emailState, password: passwordState },
      },
    },
    effects: { general: generalEffects },
  } = stateMachine;

  useRunEffects(generalEffects, effectFunctions, props, { dispatch });

  useLayoutEffect(() => {
    setUpRoutePage({
      title: LOGIN_PAGE_TITLE,
    });
  }, []);

  const onSubmit = useCallback((e: MouseEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch({
      type: ActionType.SUBMISSION,
    });
  }, []);

  const onCloseNotification = useCallback(() => {
    dispatch({
      type: ActionType.CLOSE_SUBMIT_NOTIFICATION,
    });
  }, []);

  const onEmailChanged = useCallback((e: InputChangeEvent) => {
    const node = e.currentTarget;
    dispatch({
      type: ActionType.FORM_CHANGED,
      value: node.value,
      fieldName: "email",
    });
  }, []);

  const onPasswordChanged = useCallback((e: InputChangeEvent) => {
    const node = e.currentTarget;
    dispatch({
      type: ActionType.FORM_CHANGED,
      value: node.value,
      fieldName: "password",
    });
  }, []);

  let warningText = "";

  if (submissionState.value === StateValue.warning) {
    warningText = submissionState.warning.context.warning;
  }

  let errorText = "";
  if (submissionState.value === StateValue.commonErrors) {
    errorText = submissionState.commonErrors.context.errors;
  }

  return (
    <>
      <Header />

      <form onSubmit={onSubmit} className="login-component form">
        <div className="form__caption">Login with email</div>

        {(warningText || errorText) && (
          <div
            id={notificationId}
            className={makeClassNames({
              notification: true,
              [warningClassName]: !!warningText,
              [errorClassName]: !!errorText,
            })}
          >
            <button
              type="button"
              className="delete"
              onClick={onCloseNotification}
            />
            {warningText || errorText}
          </div>
        )}

        <Email state={emailState} onFieldChanged={onEmailChanged} />

        <Password onFieldChanged={onPasswordChanged} state={passwordState} />

        <div className="form__submit">
          <button
            type="submit"
            id={submitId}
            className="button is-rounded is-primary"
          >
            Login
          </button>
        </div>

        <div className="form__submit">
          <button
            id={resetId}
            type="button"
            className="button is-rounded is-warning"
            onClick={() => {
              dispatch({
                type: ActionType.RESET_FORM_FIELDS,
              });
            }}
          >
            Reset
          </button>
        </div>

        <div className="other-auth">
          <div>Don&apos;t have an account?</div>
          <a href="/" className="other-auth__other-link">
            Sign Up
          </a>
        </div>
      </form>
    </>
  );
}

function Email(props: FieldComponentProps) {
  const { state, onFieldChanged } = props;

  let emailValue = "";
  let emailErrors: null | FieldError = null;

  if (state.states.value === StateValue.changed) {
    const {
      context: { formValue },
      states,
    } = state.states.changed;
    emailValue = formValue;

    if (states.value === StateValue.invalid) {
      emailErrors = states.invalid.context.errors;
    }
  }

  return (
    <div
      className={makeClassNames({
        "field form__field": true,
        [formFieldErrorClass]: !!emailErrors,
      })}
    >
      <label htmlFor={emailInputId} className="label form__label">
        Email
      </label>

      <div className="control">
        <input
          className="input is-rounded"
          type="text"
          id={emailInputId}
          value={emailValue}
          onChange={onFieldChanged}
          autoComplete="off"
        />
      </div>

      {emailErrors && (
        <FormCtrlError id={emailErrorId}>
          {emailErrors.map(([errorLabel, errorText], index) => {
            return (
              <div key={index}>
                <span>{errorLabel} </span>
                <span>{errorText}</span>
              </div>
            );
          })}
        </FormCtrlError>
      )}
    </div>
  );
}

function Password(props: FieldComponentProps) {
  const { state, onFieldChanged } = props;

  let passwordValue = "";
  let passwordErrors: null | FieldError = null;

  if (state.states.value === StateValue.changed) {
    const {
      context: { formValue },
      states,
    } = state.states.changed;
    passwordValue = formValue;

    if (states.value === StateValue.invalid) {
      passwordErrors = states.invalid.context.errors;
    }
  }

  return (
    <div
      className={makeClassNames({
        "field form__field": true,
        [formFieldErrorClass]: !!passwordErrors,
      })}
    >
      <label htmlFor={passwordInputId} className="label form__label">
        Password
      </label>

      <div className="control">
        <input
          className="input is-rounded"
          type="password"
          id={passwordInputId}
          value={passwordValue}
          onChange={onFieldChanged}
          autoComplete="off"
        />
      </div>

      {passwordErrors && (
        <FormCtrlError id={passwordErrorId}>
          {passwordErrors.map(([errorLabel, errorText], index) => {
            return (
              <div key={index}>
                <span>{errorLabel} </span>
                <span>{errorText}</span>
              </div>
            );
          })}
        </FormCtrlError>
      )}
    </div>
  );
}

// istanbul ignore next:
export default (props: CallerProps) => {
  const [login] = useLoginMutation();
  const {
    persistor, //
    cache,
  } = useContext(EbnisAppContext);

  return <Login {...props} login={login} persistor={persistor} cache={cache} />;
};

interface FieldComponentProps {
  state: FormField;
  onFieldChanged: (e: InputChangeEvent) => void;
}
