import gql from "graphql-tag";

export const USER_FRAGMENT = gql`
  fragment UserFragment on User {
    id
    name
    email
    jwt
  }
`;

export const REGISTER_USER_MUTATION = gql`
  mutation UserRegMutation($registration: Registration!) {
    registration(registration: $registration) {
      ...UserFragment
    }
  }
  ${USER_FRAGMENT}
`;
