import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import BooleanInput from "../inputs/BooleanInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import Button from "../inputs/Button";
import ProgressDialog from "../dialogs/ProgressDialog";
import ErrorDialog from "../dialogs/ErrorDialog";
import { withDialog } from "../contexts/DialogContext";
import styles from "./FloorPlanNodeEditor.scss";

class FloorPlanNodeEditor extends Component {
  static propTypes = {
    hideDialog: PropTypes.func.isRequired,
    showDialog: PropTypes.func.isRequired,
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-shoe-prints";

  static description = "Sets the walkable surface area in your scene.";

  constructor(props) {
    super(props);
    const createPropSetter = propName => value => this.props.editor.setNodeProperty(this.props.node, propName, value);
    this.onChangeAutoCellSize = createPropSetter("autoCellSize");
    this.onChangeCellSize = createPropSetter("cellSize");
    this.onChangeCellHeight = createPropSetter("cellHeight");
    this.onChangeAgentHeight = createPropSetter("agentHeight");
    this.onChangeAgentRadius = createPropSetter("agentRadius");
    this.onChangeAgentMaxClimb = createPropSetter("agentMaxClimb");
    this.onChangeAgentMaxSlope = createPropSetter("agentMaxSlope");
    this.onChangeRegionMinSize = createPropSetter("regionMinSize");
  }

  onRegenerate = async () => {
    const abortController = new AbortController();

    this.props.showDialog(ProgressDialog, {
      title: "Generating Floor Plan",
      message: "Generating floor plan...",
      cancelable: true,
      onCancel: () => abortController.abort()
    });

    try {
      await this.props.node.generate(abortController.signal);
      this.props.hideDialog();
    } catch (error) {
      if (error.aborted) {
        this.props.hideDialog();
        return;
      }

      console.error(error);
      this.props.showDialog(ErrorDialog, {
        title: "Error Generating Floor Plan",
        message: error.message || "There was an unknown error.",
        error
      });
    }
  };

  render() {
    const node = this.props.node;

    return (
      <NodeEditor {...this.props} description={FloorPlanNodeEditor.description}>
        <InputGroup name="Auto Cell Size">
          <BooleanInput value={node.autoCellSize} onChange={this.onChangeAutoCellSize} />
        </InputGroup>
        {!node.autoCellSize && (
          <NumericInputGroup
            name="Cell Size"
            value={node.cellSize}
            min={0.1}
            precision={0.0001}
            onChange={this.onChangeCellSize}
          />
        )}
        <NumericInputGroup name="Cell Height" value={node.cellHeight} min={0.1} onChange={this.onChangeCellHeight} />
        <NumericInputGroup name="Agent Height" value={node.agentHeight} min={0.1} onChange={this.onChangeAgentHeight} />
        <NumericInputGroup name="Agent Radius" value={node.agentRadius} min={0} onChange={this.onChangeAgentRadius} />
        <NumericInputGroup
          name="Maximum Step Height"
          value={node.agentMaxClimb}
          min={0}
          onChange={this.onChangeAgentMaxClimb}
        />
        <NumericInputGroup
          name="Maximum Slope"
          value={node.agentMaxSlope}
          min={0.00001}
          max={90}
          onChange={this.onChangeAgentMaxSlope}
        />
        <NumericInputGroup
          name="Minimum Region Area"
          value={node.regionMinSize}
          min={0.1}
          onChange={this.onChangeRegionMinSize}
        />
        <Button className={styles.regenerateButton} onClick={this.onRegenerate}>
          Regenerate
        </Button>
      </NodeEditor>
    );
  }
}

const FloorPlanNodeEditorContainer = withDialog(FloorPlanNodeEditor);
FloorPlanNodeEditorContainer.iconClassName = FloorPlanNodeEditor.iconClassName;
FloorPlanNodeEditorContainer.description = FloorPlanNodeEditor.description;
export default FloorPlanNodeEditorContainer;
