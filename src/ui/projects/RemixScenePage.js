import React, { Component } from "react";
import PropTypes from "prop-types";
import { withApi } from "../contexts/ApiContext";
import { Redirect } from "react-router-dom";
import Loading from "../Loading";
import Error from "../Error";

class RemixScenePage extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
  };

  state = {
    loading: true,
    error: null,
    projectId: null
  };

  componentDidMount() {
    const sceneId = this.props.match.params.sceneId;

    this.props.api
      .remixScene(sceneId)
      .then(({ id }) => {
        this.setState({ loading: false, projectId: id });
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
          // User has an invalid auth token. Prompt them to login again.
          this.props.api.logout();
          return this.props.history.push("/login", { from: `/scenes/${sceneId}/remix` });
        }

        this.setState({
          loading: false,
          error: err.message || "An unknown error occurred while trying to remix a scene."
        });
      });
  }

  render() {
    const { loading, error, projectId } = this.state;

    if (loading) {
      return <Loading message="Creating project..." fullScreen />;
    }

    if (error) {
      return <Error message={error} />;
    }

    return <Redirect to={`/projects/${projectId}`} />;
  }
}

export default withApi(RemixScenePage);
