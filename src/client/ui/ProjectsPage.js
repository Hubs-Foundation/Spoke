import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

export default class ProjectsPage extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      projects: []
    };
  }

  componentDidMount() {
    this.props.editor.project.getProjects().then(projects => this.setState({ projects }));
  }

  render() {
    return (
      <div>
        <h1>Projects</h1>
        <Link to="/projects/new">New Project</Link>
        <div>
          {this.state.projects.map(project => (
            <a key={project.url} href={project.url}>
              <img src={project.thumbnail} />
              <div>{project.name}</div>
            </a>
          ))}
        </div>
      </div>
    );
  }
}
