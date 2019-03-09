import React, { Component, Suspense, lazy } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import PropTypes from "prop-types";

import "./styles/global.scss";
import styles from "./styles/common.scss";

import AuthenticatedRoute from "./routes/AuthenticatedRoute";
import LogoutRoute from "./routes/LogoutRoute";
import { ApiContextProvider } from "./contexts/ApiContext";

const LandingPage = lazy(() => import("./LandingPage"));
const AuthPage = lazy(() => import("./AuthPage"));
const ProjectsPage = lazy(() => import("./ProjectsPage"));
const EditorPage = lazy(() => import("./EditorPage"));

export default class App extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired
  };

  render() {
    const api = this.props.api;

    return (
      <ApiContextProvider value={api}>
        <Router>
          <Suspense fallback="loading..." className={styles.flexColumn}>
            <Route path="/" exact component={LandingPage} />
            <Route path="/login" exact component={AuthPage} />
            <Route path="/logout" exact component={LogoutRoute} />
            <Switch>
              <AuthenticatedRoute path="/projects" exact component={ProjectsPage} />
              <AuthenticatedRoute path="/projects/new" exact component={ProjectsPage} />
              <AuthenticatedRoute path="/projects/:projectId" component={EditorPage} />
            </Switch>
          </Suspense>
        </Router>
      </ApiContextProvider>
    );
  }
}
