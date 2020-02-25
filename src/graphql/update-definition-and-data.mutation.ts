import gql from "graphql-tag";
import { useMutation } from "@apollo/react-hooks";
import { DATA_OBJECT_FRAGMENT } from "./data-object-fragment";
import {
  MutationFunction,
  MutationFunctionOptions,
  MutationResult,
} from "@apollo/react-common";
import {
  UpdateDataObjectsVariables,
  UpdateDataObjects,
} from "./apollo-types/UpdateDataObjects";

export const UPDATE_DATA_OBJECTS_RESPONSE_FRAGMENT = gql`
  fragment UpdateDataObjectsResponseFragment on UpdateDataObjectsResponse {
    id
    index
    stringError

    dataObject {
      ...DataObjectFragment
    }

    fieldErrors {
      definition
      definitionId
      data
    }
  }
  ${DATA_OBJECT_FRAGMENT}
`;

export const FRAGMENT_NAME_UpdateDataObjectsResponse =
  "UpdateDataObjectsResponse";

export const UPDATE_DATA_OBJECTS_ONLINE_MUTATION = gql`
  mutation UpdateDataObjects($input: [UpdateDataObjectInput!]!) {
    updateDataObjects(input: $input) {
      ...UpdateDataObjectsResponseFragment
    }
  }

  ${UPDATE_DATA_OBJECTS_RESPONSE_FRAGMENT}
`;

export const MUTATION_NAME_updateDataObjects = "updateDataObjects";

export type UpdateDataObjectsMutationFn = MutationFunction<
  UpdateDataObjects,
  UpdateDataObjectsVariables
>;

export type UseUpdateDataObjectsMutation = [
  UpdateDataObjectsMutationFn,
  MutationResult<UpdateDataObjects>,
];

export function useUpdateDataObjectsOnlineMutation(): UseUpdateDataObjectsMutation {
  return useMutation(UPDATE_DATA_OBJECTS_ONLINE_MUTATION);
}

// used to type check test mock calls
export type UpdateDataObjectsMutationFnOptions = MutationFunctionOptions<
  UpdateDataObjects,
  UpdateDataObjectsVariables
>;

// component's props should extend this
export interface UpdateDataObjectsOnlineMutationComponentProps {
  updateDataObjectsOnline: UpdateDataObjectsMutationFn;
}

const UPDATE_ENTRY_ERROR_FRAGMENT = gql`
  fragment UpdateEntryErrorFragment on UpdateEntryError {
    entryId
    error
  }
`;

const DATA_OBJECT_FULL_ERROR_FRAGMENT = gql`
  fragment DataObjectFullErrorFragment on DataObjectFullError {
    id
    definition
    definitionId
    clientId
    error
    data
  }
`;

const UPDATE_ENTRY_FRAGMENT = gql`
  fragment UpdateEntryFragment on UpdateEntry {
    entryId
    updatedAt
    dataObjects {
      __typename
      ... on DataObjectFullErrors {
        errors {
          ...DataObjectFullErrorFragment
        }
      }
      ... on DataObjectSuccess {
        dataObject {
          ...DataObjectFragment
        }
      }
    }
  }

  ${DATA_OBJECT_FULL_ERROR_FRAGMENT}
  ${DATA_OBJECT_FRAGMENT}
`;

export const UPDATE_ENTRY_UNION_FRAGMENT = gql`
  fragment UpdateEntryUnionFragment on UpdateEntryUnion {
    __typename
    ... on UpdateEntryErrors {
      errors {
        ...UpdateEntryErrorFragment
      }
    }
    ... on UpdateEntrySomeSuccess {
      entry {
        ...UpdateEntryFragment
      }
    }
  }
  ${UPDATE_ENTRY_ERROR_FRAGMENT}
  ${UPDATE_ENTRY_FRAGMENT}
`;

export const UPDATE_ENTRIES_ONLINE_MUTATION = gql`
  mutation UpdateEntriesOnline($input: [UpdateEntryInput!]!) {
    updateEntries(input: $input) {
      __typename
      ... on UpdateEntriesAllFail {
        error
      }
      ... on UpdateEntriesSomeSuccess {
        entries {
          ...UpdateEntryUnionFragment
        }
      }
    }
  }
  ${DATA_OBJECT_FRAGMENT}
`;

////////////////////////// UPDATE ENTRIES SECTION ////////////////////////////

import {
  UpdateEntriesOnline,
  UpdateEntriesOnlineVariables,
} from "./apollo-types/UpdateEntriesOnline";

export function useUpdateEntriesOnlineMutation(): UseUpdateEntriesOnlineMutation {
  return useMutation(UPDATE_ENTRIES_ONLINE_MUTATION);
}

export type UpdateEntriesOnlineMutationFn = MutationFunction<
  UpdateEntriesOnline,
  UpdateEntriesOnlineVariables
>;

// used to type check test mock calls
export type UpdateEntriesOnlineMutationFnOptions = MutationFunctionOptions<
  UpdateEntriesOnline,
  UpdateEntriesOnlineVariables
>;

export type UseUpdateEntriesOnlineMutation = [
  UpdateEntriesOnlineMutationFn,
  MutationResult<UpdateEntriesOnline>,
];

// component's props should extend this
export interface UpdateEntriesOnlineComponentProps {
  mutation_function_name: UpdateEntriesOnlineMutationFn;
}
