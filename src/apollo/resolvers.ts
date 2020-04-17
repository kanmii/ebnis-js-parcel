/* istanbul ignore file */
import { CacheResolver } from "apollo-cache-inmemory";

export function initState() {
  return {
    resolvers: [],
    defaults: {
      staleToken: null,
      loggedOutUser: null,
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
