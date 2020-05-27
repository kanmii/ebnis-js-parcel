import React from "react";
import Header from "../Header/header.component";
import { CallerProps, Match } from "./detail-experience.utils";
import { useGetExperienceDetail } from "../../utils/experience.gql.types";
import { entriesPaginationVariables } from "../../graphql/entry.gql";
import Loading from "../Loading/loading.component";
import { DetailExperience } from "./detail-experience.component";
import { parseStringError } from "../../utils/common-errors";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { getSyncEntriesErrorsLedger } from "../../apollo/sync-entries-errors-ledger";

export default (props: CallerProps) => {
  const { experienceId } = (props.match as Match).params;

  const { data, loading, error } = useGetExperienceDetail({
    id: experienceId,
    entriesPagination: entriesPaginationVariables.entriesPagination,
  });

  const experience = (data && data.getExperience) as ExperienceFragment;

  return (
    <>
      <Header />

      {error ? (
        parseStringError(error)
      ) : loading ? (
        <Loading />
      ) : (
        <DetailExperience
          {...props}
          experience={experience}
          syncEntriesErrors={getSyncEntriesErrorsLedger()}
        />
      )}
    </>
  );
};
