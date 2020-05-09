import React, {
  useContext,
  useEffect,
  useReducer,
  useCallback,
  FormEvent,
  ChangeEvent,
} from "react";
import makeClassNames from "classnames";
import "./new-entry.styles.scss";
import {
  CallerProps,
  Props,
  effectFunctions,
  reducer,
  initState,
  ActionType,
  DispatchType,
  FieldState,
  FormObjVal,
} from "./new-entry.utils";
import { useUpdateExperiencesOnlineMutation } from "../../utils/experience.gql.types";
import { useCreateOfflineEntryMutation } from "./new-entry.resolvers";
import { EbnisAppContext } from "../../utils/app-context";
import { addResolvers } from "./new-entry.injectables";
import Loading from "../Loading/loading.component";
import { componentFromDataType } from "./component-from-data-type";
import { DataTypes } from "../../graphql/apollo-types/globalTypes";
import FormCtrlError from "../FormCtrlError/form-ctrl-error.component";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";
import {
  submitBtnDomId,
  notificationCloseId,
  fieldErrorSelector,
} from "./new-entry.dom";
import { ActionType as DetailExperienceActionType } from "../DetailExperience/detail-experience.utils";
import { StateValue } from "../../utils/types";
import { errorClassName } from "../../utils/utils.dom";

export function NewEntry(props: Props) {
  const { experience, client, detailedExperienceDispatch } = props;

  const [stateMachine, dispatch] = useReducer(reducer, experience, initState);

  const {
    states: { submission: submissionState, form },
    effects: { general: generalEffects },
  } = stateMachine;

  useEffect(() => {
    if (generalEffects.value !== StateValue.hasEffects) {
      return;
    }

    for (const { key, ownArgs } of generalEffects.hasEffects.context.effects) {
      effectFunctions[key](
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
        ownArgs as any,
        props,
        { dispatch },
      );
    }

    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, [generalEffects]);

  const onSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch({
      type: ActionType.ON_SUBMIT,
    });
  }, []);

  const onCloseNotification = useCallback(() => {
    dispatch({
      type: ActionType.DISMISS_NOTIFICATION,
    });
  }, []);

  const onCloseComponent = useCallback(() => {
    detailedExperienceDispatch({
      type: DetailExperienceActionType.TOGGLE_NEW_ENTRY_ACTIVE,
    });
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  useEffect(() => {
    addResolvers(client);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { dataDefinitions, title } = experience;

  let errorText = "";

  if (submissionState.value === StateValue.errors) {
    errorText = submissionState.errors.context.errors;
  }

  return (
    <>
      <form
        className={makeClassNames({
          "modal is-active component-new-entry": true,
          submitting: submissionState.value === StateValue.active,
        })}
        onSubmit={onSubmit}
      >
        <div className="modal-background"></div>

        <div className="modal-card">
          <header className="modal-card-head">
            <div className="modal-card-title">
              <strong>New Entry</strong>
              <div className="experience-title">{title}</div>
            </div>

            <button
              className="delete new-entry__delete"
              aria-label="close"
              type="button"
              onClick={onCloseComponent}
            ></button>
          </header>

          <div className="modal-card-body">
            <span className="scroll-into-view" />

            {errorText && (
              <div
                className={makeClassNames({
                  notification: true,
                  [errorClassName]: true,
                })}
              >
                <button
                  id={notificationCloseId}
                  type="button"
                  className="delete"
                  onClick={onCloseNotification}
                />
                {errorText}
              </div>
            )}

            {dataDefinitions.map((obj, index) => {
              const definition = obj as DataDefinitionFragment;

              return (
                <DataComponent
                  key={definition.id}
                  definition={definition}
                  index={index}
                  fieldState={form.fields[index]}
                  dispatch={dispatch}
                />
              );
            })}
          </div>

          <footer className="modal-card-foot">
            <button
              className="button submit-btn"
              id={submitBtnDomId}
              type="submit"
            >
              Submit
            </button>
          </footer>
        </div>
      </form>

      {submissionState.value === StateValue.active && <Loading />}
    </>
  );
}

const DataComponent = React.memo(
  function DataComponentFn(props: DataComponentProps) {
    const {
      definition,
      index,
      dispatch,
      fieldState: {
        context: { value: currentValue, errors },
      },
    } = props;

    const { name: fieldTitle, type, id } = definition;

    const generic = {
      id,
      name: id,
      value: currentValue,
      onChange:
        type === DataTypes.DATE || type === DataTypes.DATETIME
          ? makeDateChangedFn(dispatch, index)
          : (e: ChangeEvent<HTMLInputElement>) => {
              const inputVal = e.currentTarget.value;

              dispatch({
                type: ActionType.ON_FORM_FIELD_CHANGED,
                fieldIndex: index,
                value:
                  type === DataTypes.DECIMAL || type === DataTypes.INTEGER
                    ? Number(inputVal)
                    : inputVal,
              });
            },
    };

    const component = componentFromDataType(type, generic);

    return (
      <div
        className={makeClassNames({
          error: !!errors,
          field: true,
        })}
      >
        <label
          className="label form__label"
          htmlFor={id}
        >{`[${type}] ${fieldTitle}`}</label>

        <div className="control">{component}</div>

        {errors && (
          <FormCtrlError className={fieldErrorSelector}>{errors}</FormCtrlError>
        )}
      </div>
    );
  },

  function DataComponentDiff(prevProps, nextProps) {
    return prevProps.fieldState === nextProps.fieldState;
  },
);

function makeDateChangedFn(dispatch: DispatchType, index: number) {
  return function makeDateChangedFnInner(fieldName: string, value: FormObjVal) {
    dispatch({
      type: ActionType.ON_FORM_FIELD_CHANGED,
      fieldIndex: index,
      value,
    });
  };
}

// istanbul ignore next:
export default (props: CallerProps) => {
  const [updateExperiencesOnline] = useUpdateExperiencesOnlineMutation();
  const [createOfflineEntry] = useCreateOfflineEntryMutation();
  const { client, persistor } = useContext(EbnisAppContext);

  return (
    <NewEntry
      {...props}
      updateExperiencesOnline={updateExperiencesOnline}
      createOfflineEntry={createOfflineEntry}
      client={client}
      persistor={persistor}
    />
  );
};

interface DataComponentProps {
  definition: DataDefinitionFragment;
  index: number;
  fieldState: FieldState;
  dispatch: DispatchType;
}

type E = React.ChangeEvent<HTMLInputElement>;
