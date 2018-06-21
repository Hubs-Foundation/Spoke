import React, { Component } from "react";
import NodePropertyGroupContainer from "./NodePropertyGroupContainer";
import styles from "./PropertiesPanelContainer.scss";

export default class PropertiesPanelContainer extends Component {
  render() {
    return (
      <div className={styles.propertiesPanelContainer}>
        <NodePropertyGroupContainer />
      </div>
    );
  }
}
