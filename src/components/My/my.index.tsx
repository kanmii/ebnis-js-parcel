import React, { useMemo } from "react";
import Header from "../Header/header.component";
import { useGetExperienceConnectionMini } from "../../utils/experience.gql.types";
import { isConnected } from "../../utils/connections";
import { GetExperienceConnectionMini_getExperiences_edges } from "../../graphql/apollo-types/GetExperienceConnectionMini";
import { ExperienceMiniFragment } from "../../graphql/apollo-types/ExperienceMiniFragment";
import { computeFetchPolicy } from "./my.utils";
import Loading from "../Loading/loading.component";
import { My } from "./my.component";
import { fetchExperiencesErrorsDomId } from "./my.dom";
import { ApolloError } from "apollo-client";
import { parseStringError } from "../../utils/common-errors";

export default () => {
  const hasConnection = isConnected() || false;

  const { data, loading, error } = useGetExperienceConnectionMini(
    computeFetchPolicy(hasConnection),
  );

  const experiences = useMemo(() => {
    const d = data && data.getExperiences;

    if (d) {
      return (d.edges as GetExperienceConnectionMini_getExperiences_edges[]).map(
        (edge) => {
          return edge.node as ExperienceMiniFragment;
        },
      );
    } else {
      return [] as ExperienceMiniFragment[];
    }
  }, [data]);

  return (
    <>
      <Header />

      {error ? (
        <FetchExperiencesFail error={error} />
      ) : loading ? (
        <Loading />
      ) : (
        <My experiences={experiences} />
      )}
    </>
  );
};

function FetchExperiencesFail(props: { error: ApolloError }) {
  const { error } = props;
  return (
    <div className="card" id={fetchExperiencesErrorsDomId}>
      <div className="card-image">
        <figure className="image is-4by3">
          <img
            src="https://bulma.io/images/placeholders/1280x960.png"
            alt="Placeholder"
          />
        </figure>
      </div>

      <div className="card-content">
        <div className="media">
          <div className="media-left">
            <figure className="image is-48x48">
              <img
                src="https://bulma.io/images/placeholders/96x96.png"
                alt="Placeholder"
              />
            </figure>
          </div>
        </div>
      </div>

      <div className="content">
        <p>{parseStringError(error)}</p>
      </div>

      <footer className="card-footer">
        <button className="button" type="button">
          Retry
        </button>
      </footer>
    </div>
  );
}
