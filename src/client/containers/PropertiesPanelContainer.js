import React, { Component } from "react";
import PropTypes from "prop-types";
import NodePropertyGroupContainer from "./NodePropertyGroupContainer";
import ComponentsContainer from "./ComponentsContainer";
import styles from "./PropertiesPanelContainer.scss";
import { withEditor } from "./EditorContext";

class PropertiesPanelContainer extends Component {
  static propTypes = {
    editor: PropTypes.object
  };

  constructor(props) {
    super(props);

    this.state = {
      node: null,
      components: []
    };
  }

  componentDidMount() {
    this.props.editor.signals.objectSelected.add(this.onObjectSelected);
    this.props.editor.signals.transformChanged.add(this.onNodeChanged);
    this.props.editor.signals.objectChanged.add(this.onNodeChanged);
  }

  componentWillUnmount() {
    this.props.editor.signals.objectSelected.remove(this.onObjectSelected);
    this.props.editor.signals.transformChanged.remove(this.onNodeChanged);
    this.props.editor.signals.objectChanged.remove(this.onNodeChanged);
  }

  onObjectSelected = object => {
    this.setState({
      node: object,
      components: (object && object.userData._components) || []
    });
  };

  onNodeChanged = object => {
    if (this.state.node === object) {
      this.setState({
        node: object,
        components: object.userData._components || []
      });
    }
  };

  render() {
    const { node } = this.state;

    if (!node) {
      return (
        <div className={styles.propertiesPanelContainer}>
          <div className={styles.noNodeSelected}>No node selected</div>
        </div>
      );
    }

    return (
      <div className={styles.propertiesPanelContainer}>
        <NodePropertyGroupContainer node={node} />
        <ComponentsContainer node={node} components={this.state.components} />
      </div>
    );
  }
}

export default withEditor(PropertiesPanelContainer);
