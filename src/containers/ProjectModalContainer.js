import React, { Component } from "react";
import PropTypes from "prop-types";
import { getTemplateProjects, getRecentProjects } from "../api";
import ProjectModal from "../components/ProjectModal";

export default class ProjectModalContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tab: "templates",
      templates: [],
      recentProjects: []
    };
  }

  componentDidMount() {
    getTemplateProjects()
      .then(templates => {
        this.setState({
          templates
        });
      })
      .catch(error => {
        throw error;
      });

    getRecentProjects()
      .then(recentProjects => {
        this.setState({
          recentProjects
        });
      })
      .catch(error => {
        throw error;
      });
  }

  onSelectProject = async projectOrTemplate => {
    if (this.state.tab === "templates") {
      this.props.onNewProject(projectOrTemplate);
    } else {
      this.props.onOpenProject(projectOrTemplate.uri);
    }
  };

  onChangeTab = tab => {
    this.setState({ tab });
  };

  render() {
    const projects = this.state.tab === "templates" ? this.state.templates : this.state.recentProjects;

    return (
      <ProjectModal
        tab={this.state.tab}
        onChangeTab={this.onChangeTab}
        projects={projects}
        onSelectProject={this.onSelectProject}
        onOpenProject={this.props.onOpenProject}
      />
    );
  }
}

ProjectModalContainer.propTypes = {
  onOpenProject: PropTypes.func.isRequired,
  onNewProject: PropTypes.func.isRequired
};
