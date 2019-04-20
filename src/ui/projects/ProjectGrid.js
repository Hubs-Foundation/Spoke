import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./ProjectGrid.scss";
import ProjectGridItem from "./ProjectGridItem";
import NewProjectGridItem from "./NewProjectGridItem";

export default class ProjectGrid extends Component {
  static propTypes = {
    contextMenuId: PropTypes.string,
    projects: PropTypes.arrayOf(PropTypes.object).isRequired,
    onSelectProject: PropTypes.func.isRequired,
    onNewProject: PropTypes.func
  };

  render() {
    return (
      <div className={styles.projectGrid}>
        {this.props.projects.map(project => (
          <ProjectGridItem
            key={project.id}
            project={project}
            contextMenuId={this.props.contextMenuId}
            onClick={this.props.onSelectProject}
          />
        ))}
        {this.props.onNewProject && <NewProjectGridItem onClick={this.props.onNewProject} />}
      </div>
    );
  }
}
