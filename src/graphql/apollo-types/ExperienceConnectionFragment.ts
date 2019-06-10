/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: ExperienceConnectionFragment
// ====================================================

export interface ExperienceConnectionFragment_pageInfo {
  __typename: "PageInfo";
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
  /**
   * When paginating backwards, are there more items?
   */
  hasPreviousPage: boolean;
}

export interface ExperienceConnectionFragment_edges_node {
  __typename: "Experience";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * The title of the experience
   */
  title: string;
  /**
   * The description of the experience
   */
  description: string | null;
}

export interface ExperienceConnectionFragment_edges {
  __typename: "ExperienceEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: ExperienceConnectionFragment_edges_node | null;
}

export interface ExperienceConnectionFragment {
  __typename: "ExperienceConnection";
  pageInfo: ExperienceConnectionFragment_pageInfo;
  edges: (ExperienceConnectionFragment_edges | null)[] | null;
}