import React, { Component } from "react";
import PropTypes from "prop-types";
import { withApi } from "../contexts/ApiContext";
import { Redirect } from "react-router-dom";
import Loading from "../Loading";
import Error from "../Error";

class NewProjectPage extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
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
        if (err.response && err.response.status === 401) {
          // User has an invalid auth token. Prompt them to login again.
          this.props.api.logout();
          return this.props.history.push("/login", { from: "/projects/new" });
        }

        this.setState({
          loading: false,
          error: err.message || "An unknown error occurred while trying to create a new project."
        });
      });
  }

  render() {
    const { loading, error, projectId } = this.state;

    if (loading) {
      return <Loading message="Creating project..." />;
    }

    if (error) {
      return <Error message="error" />;
    }

    return <Redirect to={`/projects/${projectId}`} />;
  }
}

export default withApi(NewProjectPage);
