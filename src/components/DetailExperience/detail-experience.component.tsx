import React, { useLayoutEffect } from "react";
import { CallerProps, Props, Match } from "./detail-experience.utils";
import Header from "../Header/header.component";
import { useGetExperienceDetail } from "../../utils/experience.gql.types";
import { entriesPaginationVariables } from "../../graphql/entry.gql";
import { setUpRoutePage } from "../../utils/global-window";
import Loading from "../Loading/loading.component";

export function DetailExperience(props: Props) {
  const { experience } = props;

  useLayoutEffect(() => {
    setUpRoutePage({
      title: experience.title,
      rootClassName: "my-component",
    });
  }, [experience]);

  return (
    <>
      <Header />

      <div>
        <pre>{JSON.stringify(experience)}</pre>
      </div>
    </>
  );
}

export default (props: CallerProps) => {
  const { experienceId } = (props.match as Match).params;

  const { data, loading } = useGetExperienceDetail({
    id: experienceId,
    entriesPagination: entriesPaginationVariables.entriesPagination,
  });

  if (loading) {
    return (
      <>
        <Header />
        <Loading />
      </>
    );
  }

  const experience = data && data.getExperience && data.getExperience;

  if (!experience) {
    return null;
  }

  return <DetailExperience {...props} experience={experience} />;
};
