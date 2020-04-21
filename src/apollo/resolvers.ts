/* istanbul ignore file */
import { CacheResolver } from "apollo-cache-inmemory";

export const LOGGED_IN_USER_CACHE_KEY = "loggedInUser";
export const LOGGED_OUT_USER_CACHE_KEY = "loggedOutUser";

export function initState() {
  return {
    resolvers: [],
    defaults: {
      staleToken: null,
      [LOGGED_OUT_USER_CACHE_KEY]: null,
      [LOGGED_IN_USER_CACHE_KEY]: null,
    },
  };
}

const getExperience: CacheResolver = (_, args, { getCacheKey }) =>
  getCacheKey({
    __typename: "Experience",
    id: args.id,
  });

export const CUSTOM_QUERY_RESOLVERS = {
  Query: {
    getExperience,
  },
};
