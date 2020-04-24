const EXPERIENCE_DETAIL_URL_MATCH = ":experienceId";

export const ROOT_URL = "/";
export const LOGIN_URL = "/login";
export const MY_URL = "/my";
export const EXPERIENCE_DETAIL_URL = `${MY_URL}/${EXPERIENCE_DETAIL_URL_MATCH}`;

export function makeExperienceRoute(experienceId: string) {
  return EXPERIENCE_DETAIL_URL.replace(
    EXPERIENCE_DETAIL_URL_MATCH,
    experienceId,
  );
}

export interface DetailExperienceRouteMatch {
  experienceId: string;
}
