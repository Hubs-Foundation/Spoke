import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import styles from "./NewProjectGridItem.scss";

export default class NewProjectGridItem extends Component {
  static propTypes = {
    newProjectUrl: PropTypes.string.isRequired
  };

  render() {
    return (
      <Link className={styles.newProjectGridItem} to={this.props.newProjectUrl}>
        <i className="fas fa-plus" />
        <h3>New Project</h3>
      </Link>
    );
  }
}
