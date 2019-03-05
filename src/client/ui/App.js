import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import PropTypes from "prop-types";

import "./styles/global.scss";
import styles from "./styles/common.scss";

import LandingPage from "./LandingPage";
import ProjectsPage from "./ProjectsPage";
import EditorPage from "./EditorPage";

export default class App extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired
  };

  render() {
    const editor = this.props.editor;

    return (
      <Router>
        <div className={styles.flexColumn}>
          <Route path="/" exact render={props => <LandingPage editor={editor} {...props} />} />
          <Switch>
            <Route path="/projects" exact render={props => <ProjectsPage editor={editor} {...props} />} />
            <Route path="/projects/:projectId*" render={props => <EditorPage editor={editor} {...props} />} />
          </Switch>
        </div>
      </Router>
    );
  }
}
