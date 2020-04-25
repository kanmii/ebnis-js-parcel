import React, {
  useLayoutEffect,
  useReducer,
  useCallback,
  Suspense,
} from "react";
import Header from "../Header/header.component";
import { MY_TITLE, activateNewExperienceDomId } from "./my.dom";
import { setUpRoutePage } from "../../utils/global-window";
import "./my.styles.scss";
import Loading from "../Loading/loading.component";
import { reducer, StateValue, initState, ActionType } from "./my.utils";
import { NewExperience } from "./my.lazy";

export function My() {
  const [stateMachine, dispatch] = useReducer(reducer, undefined, initState);

  const {
    states: { newExperienceActivated },
  } = stateMachine;

  useLayoutEffect(() => {
    setUpRoutePage({
      title: MY_TITLE,
      rootClassName: "my-component",
    });
  }, []);

  const onNewExperienceActivated = useCallback(() => {
    dispatch({
      type: ActionType.ACTIVATE_NEW_EXPERIENCE,
    });
  }, []);

  return (
    <>
      <Header />

      {newExperienceActivated.value === StateValue.active && (
        <Suspense fallback={<Loading />}>
          <NewExperience parentDispatch={dispatch} />
        </Suspense>
      )}

      <div
        id={activateNewExperienceDomId}
        className="new-experience-trigger"
        onClick={onNewExperienceActivated}
      >
        <span>+</span>
      </div>
    </>
  );
}

// istanbul ignore next:
export default My;
