import { RouteChildrenProps, match } from "react-router-dom";
import { DetailExperienceRouteMatch } from "../../utils/urls";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";

export type CallerProps = RouteChildrenProps<DetailExperienceRouteMatch>;

export type Props = CallerProps & {
  experience: ExperienceFragment;
};
export type Match = match<DetailExperienceRouteMatch>;
