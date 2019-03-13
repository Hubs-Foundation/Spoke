import React, { Component } from "react";
import PropTypes from "prop-types";
import { withApi } from "../contexts/ApiContext";
import EditorContainer from "../EditorContainer";

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
        this.setState({ loading: false, error: err.message || "An unknown error occurred when loading the project" });
      });
  }

  render() {
    const { api, match, history } = this.props;
    const { loading, error, project } = this.state;

    if (loading) {
      return <div>Loading project...</div>;
    }

    if (error) {
      return <div>{error}</div>;
    }

    return <EditorContainer api={api} history={history} projectId={match.params.projectId} project={project} />;
  }
}

export default withApi(ProjectPage);
