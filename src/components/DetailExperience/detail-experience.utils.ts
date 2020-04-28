import { RouteChildrenProps, match } from "react-router-dom";
import { DetailExperienceRouteMatch } from "../../utils/urls";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { isOfflineId } from "../../utils/offlines";
import { getUnsyncedExperience } from "../../apollo/unsynced-ledger";

export function getOnlineStatus<T extends { id: string }>(experience: T) {
  const { id } = experience;
  const isOffline = isOfflineId(experience.id);
  const hasUnsaved = getUnsyncedExperience(id);
  const isPartOffline = !isOffline && !!hasUnsaved;
  return { isOffline, isPartOffline };
}

export type CallerProps = RouteChildrenProps<DetailExperienceRouteMatch>;

export type Props = CallerProps & {
  experience: ExperienceFragment;
};
export type Match = match<DetailExperienceRouteMatch>;
