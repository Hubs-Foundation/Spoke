import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { withEditor } from "./contexts/EditorContext";
import { withDialog } from "./contexts/DialogContext";
import { withSceneActions } from "./contexts/SceneActionsContext";
//import ErrorDialog from "../dialogs/ErrorDialog";
import styles from "./AddNodeActionButtons.scss";

class AddNodeActionButtons extends Component {
  static propTypes = {
    editor: PropTypes.object,
    sceneActions: PropTypes.object,
    showDialog: PropTypes.func,
    hideDialog: PropTypes.func
  };

  state = {
    open: false
  };

  toggle = () => {
    this.setState({ open: !this.state.open });
  };

  addNodeWithComponent = name => {
    const editor = this.props.editor;
    editor.addUnicomponentNode(name, name);
    this.setState({ open: false });
  };

  createOrSelectSkybox = () => {
    const editor = this.props.editor;
    const existingSkybox = editor.findFirstWithComponent("skybox");

    if (existingSkybox) {
      editor.select(existingSkybox);
    } else {
      editor.addUnicomponentNode("Skybox", "skybox");
    }

    this.setState({ open: false });
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {}

  render() {
    const fabClassNames = {
      [styles.fab]: true,
      [styles.fabOpen]: this.state.open
    };

    return (
      <div className={styles.addNodeActionButtons}>
        {this.state.open && (
          <div className={styles.actionButtonContainer}>
            <button onClick={this.createOrSelectSkybox}>skybox</button>
            <button onClick={() => this.addNodeWithComponent("spawn-point")}>spawn-point</button>
          </div>
        )}
        <button onClick={this.toggle} className={classNames(fabClassNames)}>
          {this.state.open ? "Open" : "Closed"}
        </button>
      </div>
    );
  }
}

export default withEditor(withDialog(withSceneActions(AddNodeActionButtons)));
