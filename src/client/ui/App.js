import React, { Component, Suspense, lazy } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import PropTypes from "prop-types";

import "./styles/global.scss";
import styles from "./styles/common.scss";

const LandingPage = lazy(() => import("./LandingPage"));
const ProjectsPage = lazy(() => import("./ProjectsPage"));
const EditorPage = lazy(() => import("./EditorPage"));

export default class App extends Component {
  static propTypes = {
    project: PropTypes.object.isRequired
  };

  render() {
    const project = this.props.project;

    return (
      <Router>
        <Suspense fallback="loading..." className={styles.flexColumn}>
          <Route path="/" exact render={props => <LandingPage project={project} {...props} />} />
          <Switch>
            <Route path="/projects" exact render={props => <ProjectsPage project={project} {...props} />} />
            <Route path="/projects/:projectId*" render={props => <EditorPage project={project} {...props} />} />
          </Switch>
        </Suspense>
      </Router>
    );
  }
}
