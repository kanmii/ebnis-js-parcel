/* istanbul ignore file */
import ApolloClient from "apollo-client";
import { experienceDefinitionResolvers } from "./new-experience.resolvers";

export function addResolvers(client: ApolloClient<{}>) {
  if (window.____ebnis.experienceDefinitionResolversAdded) {
    return;
  }

  client.addResolvers(experienceDefinitionResolvers);
  window.____ebnis.experienceDefinitionResolversAdded = true;
}

let dataDefinitionId = 1;

export function makeDefinitionId() {
  return "" + dataDefinitionId++;
}
