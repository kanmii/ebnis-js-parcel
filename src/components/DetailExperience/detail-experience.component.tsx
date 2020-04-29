import React, { useLayoutEffect } from "react";
import "./detail-experience.styles.scss";
import { Props } from "./detail-experience.utils";
import { setUpRoutePage } from "../../utils/global-window";

export function DetailExperience(props: Props) {
  const { experience } = props;

  useLayoutEffect(() => {
    setUpRoutePage({
      title: experience.title,
    });
  }, [experience]);

  return (
    <>
      <div className="detailed-experience-component">
        <pre>{JSON.stringify(experience)}</pre>

        <div className="new-entry-trigger">
          <span>+</span>
        </div>
      </div>
    </>
  );
}
