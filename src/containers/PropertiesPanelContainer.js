import React, { Component } from "react";
import NodePropertyGroupContainer from "./NodePropertyGroupContainer";
import styles from "./PropertiesPanelContainer.scss";
import Editor from "../editor/Editor";

export default class PropertiesPanelContainer extends Component {
  render() {
    const gltfComponentOptions = [];
    Editor.gltfComponents.forEach((component, name) => {
      gltfComponentOptions.push(<option>{name}</option>);
    });
    return (
      <div className={styles.propertiesPanelContainer}>
        <NodePropertyGroupContainer />
        <div>
          <select>
            <option>Select a component</option>
            {gltfComponentOptions}
          </select>
          <button>add</button>
        </div>
      </div>
    );
  }
}
