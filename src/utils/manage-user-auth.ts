/* istanbul ignore file */
import gql from "graphql-tag";
import { UserFragment } from "../graphql/apollo-types/UserFragment";
import { InMemoryCache } from "apollo-cache-inmemory";
import {
  LOGGED_IN_USER_CACHE_KEY,
  LOGGED_OUT_USER_CACHE_KEY,
} from "../apollo/resolvers";
import { useQuery } from "@apollo/react-hooks";
import { USER_FRAGMENT } from "../graphql/user.gql";

const LOGGED_IN_USER_QUERY = gql`
  query {
    loggedInUser @client {
      ...UserFragment
    }
  }
  ${USER_FRAGMENT}
`;

export function manageUserAuthentication(
  cache: InMemoryCache,
  user: UserFragment | null
) {
  if (user) {
    cache.writeData({
      data: {
        [LOGGED_IN_USER_CACHE_KEY]: user,
        [LOGGED_OUT_USER_CACHE_KEY]: null,
      },
    });
  } else {
    const data = cache.readQuery<LoggedInUserQueryResult>({
      query: LOGGED_IN_USER_QUERY,
    });

    cache.writeData({
      data: {
        [LOGGED_IN_USER_CACHE_KEY]: null,
        [LOGGED_OUT_USER_CACHE_KEY]: data ? data.loggedInUser : null,
      },
    });
  }
}

export function useUser() {
  return useQuery<LoggedInUserQueryResult>(LOGGED_IN_USER_QUERY);
}

interface LoggedInUserQueryResult {
  loggedInUser: UserFragment;
}
