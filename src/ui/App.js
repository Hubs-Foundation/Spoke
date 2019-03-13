import React, { Component, Suspense, lazy } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import PropTypes from "prop-types";

import "./styles/global.scss";
import styles from "./styles/common.scss";

import { ApiContextProvider } from "./contexts/ApiContext";

import AuthenticatedRoute from "./auth/AuthenticatedRoute";

const LandingPage = lazy(() => import("./landing/LandingPage"));
const LoginPage = lazy(() => import("./auth/LoginPage"));
const LogoutPage = lazy(() => import("./auth/LogoutPage"));
const ProjectsPage = lazy(() => import("./projects/ProjectsPage"));
const ProjectPage = lazy(() => import("./projects/ProjectPage"));
const NewProjectPage = lazy(() => import("./projects/NewProjectPage"));

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
            <Route path="/login" exact component={LoginPage} />
            <Route path="/logout" exact component={LogoutPage} />
            <Switch>
              <AuthenticatedRoute path="/projects" exact component={ProjectsPage} />
              <AuthenticatedRoute path="/projects/new" exact component={NewProjectPage} />
              <AuthenticatedRoute path="/projects/:projectId" component={ProjectPage} />
            </Switch>
          </Suspense>
        </Router>
      </ApiContextProvider>
    );
  }
}
