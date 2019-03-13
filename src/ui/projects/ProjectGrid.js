import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./ProjectGrid.scss";
import ProjectGridItem from "./ProjectGridItem";
import NewProjectGridItem from "./NewProjectGridItem";

export default class ProjectGrid extends Component {
  static propTypes = {
    projects: PropTypes.arrayOf(PropTypes.object).isRequired
  };

  render() {
    return (
      <div className={styles.projectGrid}>
        {this.props.projects.map(project => (
          <ProjectGridItem key={project.projectId} project={project} />
        ))}
        <NewProjectGridItem />
      </div>
    );
  }
}
