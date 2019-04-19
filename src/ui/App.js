import React, { Component, Suspense, lazy } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import PropTypes from "prop-types";

import "./styles/global.scss";
import styles from "./styles/common.scss";

import Loading from "./Loading";
import Error from "./Error";

import { ApiContextProvider } from "./contexts/ApiContext";
import { AuthContextProvider } from "./contexts/AuthContext";

import AuthenticatedRoute from "./auth/AuthenticatedRoute";
import LandingPage from "./landing/LandingPage";
import LoginPage from "./auth/LoginPage";
import LogoutPage from "./auth/LogoutPage";
import ProjectsPage from "./projects/ProjectsPage";

const ProjectPage = lazy(() =>
  import(/* webpackChunkName: "project-page", webpackPrefetch: true */ "./projects/ProjectPage")
);

export default class App extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      isAuthenticated: props.api.isAuthenticated()
    };
  }

  componentDidMount() {
    this.props.api.addListener("authentication-changed", this.onAuthenticationChanged);
  }

  onAuthenticationChanged = isAuthenticated => {
    this.setState({ isAuthenticated });
  };

  componentWillUnmount() {
    this.props.api.removeListener("authentication-changed", this.onAuthenticationChanged);
  }

  render() {
    const api = this.props.api;

    return (
      <ApiContextProvider value={api}>
        <AuthContextProvider value={this.state.isAuthenticated}>
          <Router basename={process.env.ROUTER_BASE_PATH}>
            <Suspense fallback={<Loading message="Loading..." fullScreen />} className={styles.flexColumn}>
              <Switch>
                <Route path="/" exact component={LandingPage} />
                <Route path="/login" exact component={LoginPage} />
                <Route path="/logout" exact component={LogoutPage} />
                <AuthenticatedRoute path="/projects" exact component={ProjectsPage} />
                <Route path="/projects/:projectId" component={ProjectPage} />
                <Route render={() => <Error message="Page not found." />} />
              </Switch>
            </Suspense>
          </Router>
        </AuthContextProvider>
      </ApiContextProvider>
    );
  }
}
