import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./ProjectGridItem.scss";
import { Link } from "react-router-dom";

export default class ProjectGridItem extends Component {
  static propTypes = {
    project: PropTypes.object.isRequired
  };

  render() {
    const project = this.props.project;

    return (
      <Link className={styles.projectGridItem} to={`/projects/${project.projectId}`}>
        <div className={styles.thumbnailContainer}>
          {project.thumbnailUrl && (
            <div className={styles.thumbnail} style={{ backgroundImage: `url(${project.thumbnailUrl})` }} />
          )}
        </div>
        <div className={styles.titleContainer}>
          <h3>{project.name}</h3>
        </div>
      </Link>
    );
  }
}
