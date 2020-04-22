/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  buildClientCache, //
} from "../../src/apollo/setup";
import {
  UserFragment, //
} from "../../src/graphql/apollo-types/UserFragment";
import {
  CreateUserAttrs, //
  CREATE_USER_ATTRS,
} from "./create-user-attrs";

const serverUrl = Cypress.env("API_URL") as string;

function checkoutSession() {
  window.localStorage.clear();

  buildClientCache({
    uri: serverUrl,
    newE2eTest: true,
  });

  cy.request("GET", serverUrl + "/reset_db").then(response => {
    expect(response.body).to.equal("ok");
  });
}

function createUser(userData: CreateUserAttrs = CREATE_USER_ATTRS) {
  return cy
    .request("POST", serverUrl + "/create_user", { user: userData })
    .then(response => {
      return response.body as UserFragment;
    });
}

Cypress.Commands.add("checkoutSession", checkoutSession);
Cypress.Commands.add("createUser", createUser);

declare global {
  interface Window {
    Cypress: {
      env: <T>(k?: string, v?: T) => void | T;
    };
  }

  namespace Cypress {
    interface Chainable {
      checkoutSession: () => Chainable<Promise<void>>;
      createUser: (data?: CreateUserAttrs) => Chainable<Promise<UserFragment>>;
    }
  }
}
