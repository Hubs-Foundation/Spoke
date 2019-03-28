import React, { Component } from "react";
import PropTypes from "prop-types";
import { withApi } from "../contexts/ApiContext";
import EditorContainer from "../EditorContainer";
import Loading from "../Loading";
import Error from "../Error";

class ProjectPage extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  };

  state = {
    loading: true,
    error: null,
    project: null
  };

  componentDidMount() {
    const { projectId } = this.props.match.params;
    this.loadProject(projectId);
  }

  componentDidUpdate(prevProps) {
    const { projectId } = this.props.match.params;
    const { projectId: prevProjectId } = prevProps.match.params;

    if (projectId !== prevProjectId && this.state.editor.viewport) {
      this.loadProject(projectId);
    }
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

        console.log(err.response);
        this.setState({ loading: false, error: err.message || "An unknown error occurred when loading the project" });
      });
  }

  render() {
    const { api, match, history } = this.props;
    const { loading, error, project } = this.state;

    if (loading) {
      return <Loading message="Loading project..." />;
    }

    if (error) {
      return <Error message={error} />;
    }

    return <EditorContainer api={api} history={history} projectId={match.params.projectId} project={project} />;
  }
}

export default withApi(ProjectPage);
