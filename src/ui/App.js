import React, { Component, Suspense, lazy } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import PropTypes from "prop-types";

import "./styles/global.scss";
import styles from "./styles/common.scss";

import Loading from "./Loading";
import Error from "./Error";

import { ApiContextProvider } from "./contexts/ApiContext";

import AuthenticatedRoute from "./auth/AuthenticatedRoute";
import LandingPage from "./landing/LandingPage";
import LoginPage from "./auth/LoginPage";
import LogoutPage from "./auth/LogoutPage";
import ProjectsPage from "./projects/ProjectsPage";
import NewProjectPage from "./projects/NewProjectPage";

const ProjectPage = lazy(() =>
  import(/* webpackChunkName: "project-page", webpackPrefetch: true */ "./projects/ProjectPage")
);

export default class App extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired
  };

  render() {
    const api = this.props.api;

    return (
      <ApiContextProvider value={api}>
        <Router basename={process.env.ROUTER_BASE_PATH}>
          <Suspense fallback={<Loading message="Loading..." />} className={styles.flexColumn}>
            <Switch>
              <Route path="/" exact component={LandingPage} />
              <Route path="/login" exact component={LoginPage} />
              <Route path="/logout" exact component={LogoutPage} />
              <AuthenticatedRoute path="/projects" exact component={ProjectsPage} />
              <AuthenticatedRoute path="/projects/new" exact component={NewProjectPage} />
              <AuthenticatedRoute path="/projects/:projectId" component={ProjectPage} />
              <Route render={() => <Error message="Page not found." />} />
            </Switch>
          </Suspense>
        </Router>
      </ApiContextProvider>
    );
  }
}
