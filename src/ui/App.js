import React, { Component, Suspense, lazy } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import PropTypes from "prop-types";

import GlobalStyle from "./GlobalStyle";

import Loading from "./Loading";
import Error from "./Error";

import { ApiContextProvider } from "./contexts/ApiContext";
import { AuthContextProvider } from "./contexts/AuthContext";

import RedirectRoute from "./router/RedirectRoute";
import { withPageView } from "../telemetry";

import LandingPage from "./landing/LandingPage";
import WhatsNewPage from "./whats-new/WhatsNewPage";
import LoginPage from "./auth/LoginPage";
import LogoutPage from "./auth/LogoutPage";
import ProjectsPage from "./projects/ProjectsPage";
import TemplatesPage from "./projects/TemplatesPage";

import { ThemeProvider } from "styled-components";

import { Column } from "./layout/Flex";

import theme from "./theme";

const ProjectPage = lazy(() =>
  import(/* webpackChunkName: "project-page", webpackPrefetch: true */ "./projects/ProjectPage")
);

const PackageKitPage = lazy(() =>
  import(/* webpackChunkName: "package-kit-page", webpackPrefetch: true */ "./assets/PackageKitPage")
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
          <ThemeProvider theme={theme}>
            <Router basename={process.env.ROUTER_BASE_PATH}>
              <GlobalStyle />
              <Column as={Suspense} fallback={<Loading message="Loading..." fullScreen />}>
                <Switch>
                  <Route path="/" exact component={withPageView(LandingPage)} />
                  <Route path="/whats-new" exact component={withPageView(WhatsNewPage)} />
                  <RedirectRoute path="/new" exact to="/projects" />
                  <Route path="/login" exact component={withPageView(LoginPage)} />
                  <Route path="/logout" exact component={withPageView(LogoutPage)} />
                  <Route path="/projects/templates" exact component={withPageView(TemplatesPage)} />
                  <Route path="/projects" exact component={withPageView(ProjectsPage)} />
                  <Route
                    path="/projects/:projectId"
                    component={withPageView(ProjectPage, "/projects/editor", "Editor")}
                  />
                  <Route path="/kits/package" component={withPageView(PackageKitPage)} />
                  <Route render={() => <Error message="Page not found." />} />
                </Switch>
              </Column>
            </Router>
          </ThemeProvider>
        </AuthContextProvider>
      </ApiContextProvider>
    );
  }
}
