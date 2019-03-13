import React, { Component } from "react";
import PropTypes from "prop-types";
import { withApi } from "../contexts/ApiContext";
import { Redirect } from "react-router-dom";

class NewProjectPage extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired
  };

  state = {
    loading: true,
    error: null,
    projectId: null
  };

  componentDidMount() {
    this.props.api
      .createProject("Untitled")
      .then(({ projectId }) => {
        this.setState({ loading: false, projectId });
      })
      .catch(err => {
        this.setState({
          loading: false,
          error: err.message || "An unknown error occurred while trying to create a new project."
        });
      });
  }

  render() {
    const { loading, error, projectId } = this.state;

    if (loading) {
      return <div>Creating project...</div>;
    }

    if (error) {
      return <div>{error}</div>;
    }

    return <Redirect to={`/projects/${projectId}`} />;
  }
}

export default withApi(NewProjectPage);
