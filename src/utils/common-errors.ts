import { ApolloError } from "apollo-client";

export function parseStringError(error: string | Error): string {
  if (error instanceof ApolloError) {
    const { graphQLErrors, networkError } = error;
    return networkError ? networkError.message : graphQLErrors[0].message;
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return error;
  }
}

export const FORM_CONTAINS_ERRORS_MESSAGE =
  "Form contains errors. Please correct them and save again.";

export const GENERIC_SERVER_ERROR = "Something went wrong - please try again.";

export const NOTHING_TO_SAVE_WARNING_MESSAGE =
  "Please make changes before saving.";

export const NO_CONNECTION_ERROR =
  "You are not connected - please check your internet connection and try again.";

export interface StringyErrorPayload {
  error: Error | string;
}
