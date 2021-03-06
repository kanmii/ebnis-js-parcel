import { useMutation } from "@apollo/react-hooks";
import {
  MutationFunctionOptions,
  MutationResult,
  ExecutionResult,
  MutationFunction,
} from "@apollo/react-common";
import {
  UPDATE_EXPERIENCES_ONLINE_MUTATION, //
  CREATE_EXPERIENCES_MUTATION,
  DELETE_EXPERIENCES_MUTATION,
} from "../graphql/experience.gql";
import { UpdateExperienceFragment } from "../graphql/apollo-types/UpdateExperienceFragment";
import {
  UpdateExperienceInput, //
} from "../graphql/apollo-types/globalTypes";
import {
  CommonError, //
} from "../utils/types";
import {
  writeUpdatedExperienceToCache, //
} from "../apollo/write-updated-experiences-to-cache";
import {
  UpdateExperiencesOnline,
  UpdateExperiencesOnlineVariables,
} from "../graphql/apollo-types/UpdateExperiencesOnline";
import {
  CreateExperiences,
  CreateExperiencesVariables,
} from "../graphql/apollo-types/CreateExperiences";
import {
  DeleteExperiences,
  DeleteExperiencesVariables,
} from "../graphql/apollo-types/DeleteExperiences";

////////////////////////// UPDATE EXPERIENCES SECTION //////////////////

export function useUpdateExperiencesOnlineMutation(): UseUpdateExperiencesOnlineMutation {
  return useMutation(UPDATE_EXPERIENCES_ONLINE_MUTATION);
}

export async function updateExperiencesOnlineEffectHelperFunc(
  input: UpdateExperienceInput[],
  updateExperiencesOnline: UpdateExperiencesOnlineMutationFn,
  onUpdateSuccess: (arg: UpdateExperienceFragment) => void,
  onError: (error?: CommonError) => void,
  onDone?: () => void
) {
  try {
    const response = await updateExperiencesOnline({
      variables: {
        input,
      },

      update: writeUpdatedExperienceToCache(onDone),
    });

    const validResponse =
      response && response.data && response.data.updateExperiences;

    if (!validResponse) {
      onError();
      return;
    }

    if (validResponse.__typename === "UpdateExperiencesAllFail") {
      onError(validResponse.error);
    } else {
      const updateResult = validResponse.experiences[0];

      if (updateResult.__typename === "UpdateExperienceErrors") {
        onError(updateResult.errors.error);
      } else {
        const { experience } = updateResult;
        onUpdateSuccess(experience);
      }
    }
  } catch (errors) {
    onError(errors);
  }
}

export type UpdateExperiencesOnlineMutationFn = MutationFunction<
  UpdateExperiencesOnline,
  UpdateExperiencesOnlineVariables
>;

export type UpdateExperiencesOnlineMutationResult = ExecutionResult<
  UpdateExperiencesOnline
>;

// used to type check test mock calls
export type UpdateExperiencesOnlineMutationFnOptions = MutationFunctionOptions<
  UpdateExperiencesOnline,
  UpdateExperiencesOnlineVariables
>;

export type UseUpdateExperiencesOnlineMutation = [
  UpdateExperiencesOnlineMutationFn,
  MutationResult<UpdateExperiencesOnline>
];

// component's props should extend this
export interface UpdateExperiencesOnlineComponentProps {
  updateExperiencesOnline: UpdateExperiencesOnlineMutationFn;
}

////////////////////////// END UPDATE EXPERIENCES SECTION //////////////////

////////////////////////// START CREATE EXPERIENCES SECTION ////////////////////

export function useCreateExperiencesMutation(): UseCreateExperiencesMutation {
  return useMutation(CREATE_EXPERIENCES_MUTATION);
}

type CreateExperiencesMutationFn = MutationFunction<
  CreateExperiences,
  CreateExperiencesVariables
>;

// used to type check test mock resolved value
export type CreateExperiencesMutationResult = ExecutionResult<
  CreateExperiences
>;

// used to type check test mock calls
export type CreateExperiencesMutationFnOptions = MutationFunctionOptions<
  CreateExperiences,
  CreateExperiencesVariables
>;

type UseCreateExperiencesMutation = [
  CreateExperiencesMutationFn,
  MutationResult<CreateExperiences>
];

// component's props should extend this
export interface CreateExperiencesComponentProps {
  createExperiences: CreateExperiencesMutationFn;
}

////////////////////////// END CREATE EXPERIENCES SECTION ///////////////

////////////////////////// DELETE EXPERIENCES SECTION ///////////////

export function useDeleteExperiencesMutation(): UseDeleteExperiencesMutation {
  return useMutation(DELETE_EXPERIENCES_MUTATION);
}

export type DeleteExperiencesMutationFn = MutationFunction<
  DeleteExperiences,
  DeleteExperiencesVariables
>;

// used to type check test fake mutation function return value e.g. {data: {result: {}}}
export type DeleteExperiencesMutationResult = ExecutionResult<
  DeleteExperiences
>;

// used to type check test fake function calls arguments
export type DeleteExperiencesMutationFnOptions = MutationFunctionOptions<
  DeleteExperiences,
  DeleteExperiencesVariables
>;

export type UseDeleteExperiencesMutation = [
  DeleteExperiencesMutationFn,
  MutationResult<DeleteExperiences>
];

// component's props should extend this
export interface DeleteExperiencesComponentProps {
  deleteExperiences: DeleteExperiencesMutationFn;
}

////////////////////////// END DELETE EXPERIENCES SECTION ////////////
