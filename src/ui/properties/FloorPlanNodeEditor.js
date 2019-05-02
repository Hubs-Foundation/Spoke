import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import BooleanInput from "../inputs/BooleanInput";
import NumericInput from "../inputs/NumericInput";
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
      if (error.message && error.message.startsWith("Canceled")) {
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
          <InputGroup name="Cell Size">
            <NumericInput value={node.cellSize} min={0.1} precision={0.0001} onChange={this.onChangeCellSize} />
          </InputGroup>
        )}
        <InputGroup name="Cell Height">
          <NumericInput value={node.cellHeight} min={0.1} onChange={this.onChangeCellHeight} />
        </InputGroup>
        <InputGroup name="Agent Height">
          <NumericInput value={node.agentHeight} min={0.1} onChange={this.onChangeAgentHeight} />
        </InputGroup>
        <InputGroup name="Agent Radius">
          <NumericInput value={node.agentRadius} min={0} onChange={this.onChangeAgentRadius} />
        </InputGroup>
        <InputGroup name="Maximum Step Height">
          <NumericInput value={node.agentMaxClimb} min={0} onChange={this.onChangeAgentMaxClimb} />
        </InputGroup>
        <InputGroup name="Maximum Slope">
          <NumericInput value={node.agentMaxSlope} min={0.00001} max={90} onChange={this.onChangeAgentMaxSlope} />
        </InputGroup>
        <InputGroup name="Minimum Region Area">
          <NumericInput value={node.regionMinSize} min={0.1} onChange={this.onChangeRegionMinSize} />
        </InputGroup>
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
