/* istanbul ignore file */
import React, { lazy, Suspense } from "react";
import { ApolloProvider } from "@apollo/react-hooks";
import { EbnisAppProvider } from "./app.injectables";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { E2EWindowObject } from "../../utils/types";
import { restoreCacheOrPurgeStorage } from "../../apollo/setup";
import Loading from "../Loading/loading.component";
import WithEmitter from "./with-emitter.component";
import {
  ROOT_URL, //
  LOGIN_URL,
  MY_URL,
} from "../../utils/urls";

const Login = lazy(() => import("../Login/login.component"));
const My = lazy(() => import("../My/my.component"));

export function AppInner({ obj }: { obj: E2EWindowObject }) {
  const { client, cache, persistor, observable } = obj;

  return (
    <Router>
      <ApolloProvider client={client}>
        <EbnisAppProvider
          value={{
            client,
            cache,
            restoreCacheOrPurgeStorage,
            persistor,
            ...window.____ebnis,
          }}
        >
          <Suspense fallback={<Loading />}>
            <WithEmitter observable={observable}>
              <Switch>
                <Route exact={true} path={MY_URL} component={My} />
                <Route exact={true} path={ROOT_URL} component={Login} />
                <Route exact={true} path={LOGIN_URL} component={Login} />
              </Switch>
            </WithEmitter>
          </Suspense>
        </EbnisAppProvider>
      </ApolloProvider>
    </Router>
  );
}

// istanbul ignore next:
export default AppInner;
