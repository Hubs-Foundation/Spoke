import React, { Component } from "react";
import styles from "./NewProjectGridItem.scss";
import { Link } from "react-router-dom";

export default class NewProjectGridItem extends Component {
  render() {
    return (
      <Link className={styles.newProjectGridItem} to={`/projects/new`}>
        <i className="fas fa-plus" />
        <h3>New Project</h3>
      </Link>
    );
  }
}
