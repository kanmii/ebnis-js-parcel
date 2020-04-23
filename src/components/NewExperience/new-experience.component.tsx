import React, {
  useReducer,
  useContext,
  useEffect,
  useCallback,
  FormEvent,
} from "react";
import makeClassNames from "classnames";
import "./new-experience.styles.scss";
import {
  Props,
  initState,
  reducer,
  StateValue,
  effectFunctions,
  ActionType,
  fieldTypeKeys,
  Submission,
  FormValidity,
} from "./new-experience.utils";
import {
  scrollIntoViewDomId,
  titleInputDomId,
  descriptionInputDomId,
  definitionNameInputDomId,
  definitionTypeInputDomId,
  makeDefinitionTypeOptionDomId,
  submitDomId,
  resetDomId,
  notificationCloseId,
  revealDescriptionInputDomId,
  hideDescriptionInputDomId,
  makeDefinitionContainerDomId,
  moveDownDefinitionSelector,
  moveUpDefinitionSelector,
  removeDefinitionSelector,
  addDefinitionSelector,
  definitionNameFormControlSelector,
  fieldErrorSelector,
  definitionTpeFormControlSelector,
} from "./new-experience.dom";
import { EbnisAppContext } from "../../utils/app-context";
import { useCreateExperienceOfflineMutation } from "./new-experience.resolvers";
import { useCreateExperiencesMutation } from "../../utils/experience.gql.types";
import { DataTypes } from "../../graphql/apollo-types/globalTypes";
import Loading from "../Loading/loading.component";
import { FormCtrlError } from "../FormCtrlError/form-ctrl-error.component";
import { FieldError } from "../../utils/common-errors";
import { addResolvers } from "./new-experience.injectables";
import {
  warningClassName,
  errorClassName, //
} from "../../utils/utils.dom";

export function NewExperience(props: Props) {
  const { client } = props;
  const [stateMachine, dispatch] = useReducer(reducer, undefined, initState);

  const {
    states: {
      submission: submissionState,
      form: {
        validity: formValidity,
        fields: {
          title: titleState,
          description: descriptionState,
          dataDefinitions: dataDefinitionsStates,
        },
      },
    },
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

  useEffect(() => {
    addResolvers(client);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    dispatch({
      type: ActionType.SUBMITTING,
    });
  }, []);

  const onCloseNotification = useCallback(() => {
    dispatch({
      type: ActionType.CLOSE_SUBMIT_NOTIFICATION,
    });
  }, []);

  let titleValue = "";
  let titleErrors: null | FieldError = null;

  if (titleState.states.value === StateValue.changed) {
    const {
      context: { formValue },
      states,
    } = titleState.states.changed;
    titleValue = formValue;

    if (states.value === StateValue.invalid) {
      titleErrors = states.invalid.context.errors;
    }
  }

  let descriptionValue = "";
  let descriptionActive = false;
  if (descriptionState.value === StateValue.active) {
    const activeState = descriptionState.active;
    descriptionActive = true;

    if (activeState.states.value === StateValue.changed) {
      const changedState = activeState.states.changed;
      descriptionValue = changedState.context.formValue;
    }
  }

  const dataDefinitionsAttributesList = Object.entries(dataDefinitionsStates);
  const definitionsLen = dataDefinitionsAttributesList.length;

  return (
    <form
      className="form component-new-experience modal is-active"
      onSubmit={onSubmit}
    >
      <div className="modal-background"></div>

      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">New Experience Definition</p>
          <button type="button" className="delete" aria-label="close"></button>
        </header>

        <section className="modal-card-body">
          <span
            className="visually-hidden"
            id={scrollIntoViewDomId}
            style={{
              position: "relative",
              top: "-40px",
            }}
          />

          <ErrorOrWarning
            formValidity={formValidity}
            submissionState={submissionState}
            onCloseNotification={onCloseNotification}
          />

          <div className="field form__field">
            <label
              htmlFor={titleInputDomId}
              className={makeClassNames({
                form__label: true,
                "form__field--errors": !!titleErrors,
              })}
            >
              Title
            </label>

            <div className="control">
              <input
                className="form__control input is-rounded"
                type="text"
                id={titleInputDomId}
                value={titleValue}
                onChange={(e) => {
                  const node = e.currentTarget;
                  dispatch({
                    type: ActionType.FORM_CHANGED,
                    key: "non-def",
                    value: node.value,
                    fieldName: "title",
                  });
                }}
              />
            </div>

            {titleErrors && (
              <FormCtrlError id={titleInputDomId + "-errors"}>
                {titleErrors.map(([errorLabel, errorText], index) => {
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

          <div className="field form__field">
            <label
              htmlFor={descriptionInputDomId}
              className="form__label form__label-description"
            >
              <span>Description</span>

              {descriptionActive ? (
                <div
                  className="form__label-description-toggle"
                  id={hideDescriptionInputDomId}
                  onClick={() => {
                    dispatch({
                      type: ActionType.TOGGLE_DESCRIPTION,
                    });
                  }}
                >
                  <span className="chevron-down " />
                </div>
              ) : (
                <div
                  id={revealDescriptionInputDomId}
                  className="form__label-description-toggle"
                  onClick={() => {
                    dispatch({
                      type: ActionType.TOGGLE_DESCRIPTION,
                    });
                  }}
                >
                  <span className="chevron-up" />
                </div>
              )}
            </label>

            <div className="control">
              <textarea
                rows={7}
                className={makeClassNames({
                  "form__control textarea": true,
                  "form__control--hidden": !descriptionActive,
                })}
                id={descriptionInputDomId}
                value={descriptionValue}
                onChange={(e) => {
                  const node = e.currentTarget;
                  dispatch({
                    type: ActionType.FORM_CHANGED,
                    key: "non-def",
                    value: node.value,
                    fieldName: "description",
                  });
                }}
              />
            </div>
          </div>

          <div className="data-definitions">
            {dataDefinitionsAttributesList.map(([id, definitionProperties]) => {
              const {
                index,
                name: nameState,
                type: typeState,
              } = definitionProperties;

              let nameValue = "";
              let nameErrors: null | FieldError = null;
              if (nameState.states.value === StateValue.changed) {
                const {
                  states,
                  context: { formValue },
                } = nameState.states.changed;
                nameValue = formValue;

                if (states.value === StateValue.invalid) {
                  nameErrors = states.invalid.context.errors;
                }
              }

              let typeValue = "" as DataTypes;
              let typeErrors: null | FieldError = null;
              if (typeState.states.value === StateValue.changed) {
                const {
                  states,
                  context: { formValue },
                } = typeState.states.changed;
                typeValue = formValue;

                if (states.value === StateValue.invalid) {
                  typeErrors = states.invalid.context.errors;
                }
              }

              return (
                <div
                  key={id}
                  className="data-definition"
                  id={makeDefinitionContainerDomId(id)}
                >
                  <div className="field form__field">
                    <label
                      htmlFor={definitionNameInputDomId + id}
                      className={makeClassNames({
                        form__label: true,
                        "form__field--errors": !!nameErrors,
                      })}
                    >
                      Field name
                    </label>

                    <div className="control">
                      <input
                        type="text"
                        className={makeClassNames({
                          "input form__control is-rounded": true,
                          [definitionNameFormControlSelector]: true,
                        })}
                        id={definitionNameInputDomId + id}
                        value={nameValue}
                        onChange={(e) => {
                          const node = e.currentTarget;
                          dispatch({
                            type: ActionType.FORM_CHANGED,
                            key: "def",
                            index,
                            value: node.value,
                            fieldName: "name",
                          });
                        }}
                      />
                    </div>

                    {nameErrors && (
                      <FormCtrlError className={fieldErrorSelector}>
                        {nameErrors.map(([errorLabel, errorText], index) => {
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

                  <div className="field form__field">
                    <label
                      htmlFor={definitionTypeInputDomId + id}
                      className={makeClassNames({
                        form__label: true,
                        "form__field--errors": !!typeErrors,
                      })}
                    >
                      Data type
                    </label>

                    <div className="control">
                      <div className="select is-rounded">
                        <select
                          className={makeClassNames({
                            "form__control form__control--select": true,
                            [definitionTpeFormControlSelector]: true,
                          })}
                          id={definitionTypeInputDomId + id}
                          value={typeValue}
                          onChange={(e) => {
                            const node = e.currentTarget;
                            dispatch({
                              type: ActionType.FORM_CHANGED,
                              key: "def",
                              index,
                              value: node.value,
                              fieldName: "type",
                            });
                          }}
                        >
                          <option value="">Click to select</option>

                          {fieldTypeKeys.map((fieldType) => {
                            return (
                              <option
                                key={fieldType}
                                value={fieldType}
                                id={makeDefinitionTypeOptionDomId(fieldType)}
                              >
                                {fieldType}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {typeErrors && (
                      <FormCtrlError className={fieldErrorSelector}>
                        {typeErrors.map(([errorLabel, errorText], index) => {
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

                  <div className="data-definition-controls">
                    <button
                      type="button"
                      className={`button is-rounded data-definition-control ${addDefinitionSelector}`}
                      onClick={() => {
                        dispatch({
                          type: ActionType.ADD_DEFINITION,
                          data: definitionProperties,
                        });
                      }}
                    >
                      <span className="icon is-small">
                        <i className="fas fa-plus"></i>
                      </span>
                    </button>

                    {definitionsLen !== 1 && (
                      <button
                        type="button"
                        className={`button is-rounded data-definition-control ${removeDefinitionSelector}`}
                        onClick={() => {
                          dispatch({
                            type: ActionType.REMOVE_DEFINITION,
                            data: definitionProperties,
                          });
                        }}
                      >
                        <span className="icon is-small">
                          <i className="fas fa-minus"></i>
                        </span>
                      </button>
                    )}

                    {index !== 0 && (
                      <button
                        type="button"
                        className={`button is-rounded data-definition-control ${moveUpDefinitionSelector}`}
                        onClick={() => {
                          dispatch({
                            type: ActionType.UP_DEFINITION,
                            data: definitionProperties,
                          });
                        }}
                      >
                        <span className="icon is-small">
                          <i className="fas fa-chevron-up"></i>
                        </span>
                      </button>
                    )}

                    {definitionsLen > 1 && index + 1 !== definitionsLen && (
                      <button
                        type="button"
                        className={makeClassNames({
                          "button is-rounded": true,
                          "data-definition-control": true,
                          "data-definition-control--down": true,
                          [moveDownDefinitionSelector]: true,
                        })}
                        onClick={() => {
                          dispatch({
                            type: ActionType.DOWN_DEFINITION,
                            data: definitionProperties,
                          });
                        }}
                      >
                        <span className="icon is-small">
                          <i className="fas fa-chevron-down"></i>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="modal-card-foot">
          <button
            type="submit"
            id={submitDomId}
            className="button is-rounded is-primary"
          >
            Save changes
          </button>

          <button
            id={resetDomId}
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
        </footer>
      </div>
    </form>
  );
}

function ErrorOrWarning({
  submissionState,
  onCloseNotification,
  formValidity,
}: {
  submissionState: Submission;
  onCloseNotification: () => void;
  formValidity: FormValidity;
}) {
  if (submissionState.value === StateValue.submitting) {
    return <Loading />;
  }

  let warningText = "";
  let errorText = "";

  if (submissionState.value === StateValue.commonErrors) {
    errorText = submissionState.commonErrors.context.errors;
  } else if (submissionState.value === StateValue.warning) {
    warningText = submissionState.warning.context.warning;
  } else if (formValidity.value === StateValue.invalid) {
    errorText = "Errors while creating experience";
  }

  return warningText || errorText ? (
    <div
      id={notificationCloseId}
      className={makeClassNames({
        notification: true,
        [warningClassName]: !!warningText,
        [errorClassName]: !!errorText,
      })}
    >
      <button type="button" className="delete" onClick={onCloseNotification} />
      {warningText || errorText}
    </div>
  ) : null;
}

// istanbul ignore next:
export default () => {
  const [createExperienceOffline] = useCreateExperienceOfflineMutation();
  const [createExperiences] = useCreateExperiencesMutation();
  const { client, persistor } = useContext(EbnisAppContext);

  return (
    <NewExperience
      client={client}
      createExperiences={createExperiences}
      createExperienceOffline={createExperienceOffline}
      persistor={persistor}
    />
  );
};
