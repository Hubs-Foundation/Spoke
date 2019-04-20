import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./NewProjectGridItem.scss";

export default class NewProjectGridItem extends Component {
  static propTypes = {
    onClick: PropTypes.func.isRequired
  };

  render() {
    return (
      <div className={styles.newProjectGridItem} onClick={this.props.onClick}>
        <i className="fas fa-plus" />
        <h3>New Project</h3>
      </div>
    );
  }
}
