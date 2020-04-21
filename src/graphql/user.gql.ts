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
  mutation RegisterUserMutation($input: RegisterUserInput!) {
    registerUser(input: $input) {
      __typename
      ... on UserSuccess {
        user {
          ...UserFragment
        }
      }
      ... on RegisterUserErrors {
        errors {
          email
          password
          passwordConfirmation
        }
      }
    }
  }
  ${USER_FRAGMENT}
`;

export const LOGIN_MUTATION = gql`
  mutation LoginMutation($input: LoginInput!) {
    login(input: $input) {
      __typename
      ... on UserSuccess {
        user {
          ...UserFragment
        }
      }
      ... on LoginError {
        error
      }
    }
  }
  ${USER_FRAGMENT}
`;
