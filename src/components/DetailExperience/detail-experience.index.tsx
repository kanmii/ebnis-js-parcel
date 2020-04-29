import React from "react";
import Header from "../Header/header.component";
import { CallerProps, Match } from "./detail-experience.utils";
import { useGetExperienceDetail } from "../../utils/experience.gql.types";
import { entriesPaginationVariables } from "../../graphql/entry.gql";
import Loading from "../Loading/loading.component";
import { DetailExperience } from "./detail-experience.component";

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

  return (
    <>
      <Header />
      <DetailExperience {...props} experience={experience} />;
    </>
  );
};
