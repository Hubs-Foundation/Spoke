import React, { Component } from "react";
import PropTypes from "prop-types";
import * as Sentry from "@sentry/browser";
import { withApi } from "../contexts/ApiContext";
import EditorContainer from "../EditorContainer";
import Loading from "../Loading";
import Error from "../Error";
import defaultTemplateUrl from "../../assets/templates/default.spoke";
import tutorialTemplateUrl from "../../assets/templates/tutorial.spoke";

class ProjectPage extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  };

  state = {
    loading: true,
    error: null,
    project: null
  };

  componentDidMount() {
    const { match, location } = this.props;
    const projectId = match.params.projectId;
    const queryParams = new URLSearchParams(location.search);

    if (projectId === "new") {
      if (queryParams.has("template")) {
        this.loadProjectTemplate(queryParams.get("template"));
      } else {
        this.loadProjectTemplate(defaultTemplateUrl);
      }
    } else if (projectId === "tutorial") {
      this.loadProjectTemplate(tutorialTemplateUrl);
    } else {
      this.loadProject(projectId);
    }
  }

  componentDidUpdate(prevProps) {
    const { projectId } = this.props.match.params;
    const queryParams = new URLSearchParams(location.search);
    const { projectId: prevProjectId } = prevProps.match.params;

    if (projectId !== prevProjectId) {
      if (projectId === "new") {
        if (queryParams.has("template")) {
          this.loadProjectTemplate(queryParams.get("template"));
        } else {
          this.loadProjectTemplate(defaultTemplateUrl);
        }
      } else if (projectId === "tutorial") {
        this.loadProjectTemplate(tutorialTemplateUrl);
      } else if (prevProjectId !== "tutorial" && prevProjectId !== "new") {
        this.loadProject(projectId);
      }
    }
  }

  loadProjectTemplate(templateUrl) {
    this.props.api
      .fetch(templateUrl)
      .then(response => response.json())
      .then(project => this.setState({ loading: false, project }))
      .catch(err => {
        Sentry.captureException(err);
        console.error(err.response);
        this.setState({ loading: false, error: err.message || "An unknown error occurred when loading the project" });
      });
  }

  loadProject(projectId) {
    this.setState({ loading: true });

    this.props.api
      .getProject(projectId)
      .then(({ project }) => {
        this.setState({ loading: false, project });
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
          // User has an invalid auth token.
          return this.props.history.push("/projects");
        }
        Sentry.captureException(err);
        console.error(err.response);
        this.setState({ loading: false, error: err.message || "An unknown error occurred when loading the project" });
      });
  }

  render() {
    const { api, match, history } = this.props;
    const { loading, error, project } = this.state;

    if (loading) {
      return <Loading message="Loading project..." fullScreen />;
    }

    if (error) {
      return <Error className="project-error" message={error} />;
    }

    return <EditorContainer api={api} history={history} projectId={match.params.projectId} project={project} />;
  }
}

export default withApi(ProjectPage);
