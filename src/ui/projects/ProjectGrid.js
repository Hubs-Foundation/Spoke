import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./ProjectGrid.scss";
import ProjectGridItem from "./ProjectGridItem";
import NewProjectGridItem from "./NewProjectGridItem";

export default class ProjectGrid extends Component {
  static propTypes = {
    contextMenuId: PropTypes.string,
    projects: PropTypes.arrayOf(PropTypes.object).isRequired,
    showNewProjectItem: PropTypes.bool,
    onSelect: PropTypes.func.isRequired
  };

  render() {
    return (
      <div className={styles.projectGrid}>
        {this.props.projects.map(project => (
          <ProjectGridItem
            key={project.id}
            project={project}
            onSelect={this.props.onSelect}
            contextMenuId={this.props.contextMenuId}
          />
        ))}
        {this.props.showNewProjectItem && <NewProjectGridItem />}
      </div>
    );
  }
}
