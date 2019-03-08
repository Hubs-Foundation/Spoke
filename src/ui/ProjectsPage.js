import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { withApi } from "./contexts/ApiContext";

class ProjectsPage extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      projects: [],
      error: null
    };
  }

  componentDidMount() {
    this.props.api
      .getProjects()
      .then(projects => this.setState({ projects }))
      .catch(error => {
        console.error(error);
        this.setState({ error });
      });
  }

  render() {
    const { error, projects } = this.state;

    return (
      <div>
        <h1>Projects</h1>
        <Link to="/projects/new">New Project</Link>
        <div>
          {error
            ? error.message || "There was an unknown error."
            : projects.map(project => (
                <Link key={project.id} to={`/projects/${project.id}`}>
                  <img src={project.thumbnailUrl} />
                  <div>{project.name}</div>
                </Link>
              ))}
        </div>
      </div>
    );
  }
}

export default withApi(ProjectsPage);
