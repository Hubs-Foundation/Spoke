import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import BooleanInput from "../inputs/BooleanInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import { PropertiesPanelButton } from "../inputs/Button";
import ProgressDialog from "../dialogs/ProgressDialog";
import ErrorDialog from "../dialogs/ErrorDialog";
import { withDialog } from "../contexts/DialogContext";
import { withSettings } from "../contexts/SettingsContext";
import { ShoePrints } from "styled-icons/fa-solid/ShoePrints";
import { NavMeshMode } from "../../editor/nodes/FloorPlanNode";
import SelectInput from "../inputs/SelectInput";
import ModelInput from "../inputs/ModelInput";

const NavMeshModeOptions = [
  {
    label: "Automatic",
    value: NavMeshMode.Automatic
  },
  {
    label: "Custom",
    value: NavMeshMode.Custom
  }
];

class FloorPlanNodeEditor extends Component {
  static propTypes = {
    hideDialog: PropTypes.func.isRequired,
    showDialog: PropTypes.func.isRequired,
    editor: PropTypes.object,
    settings: PropTypes.object.isRequired,
    node: PropTypes.object
  };

  static iconComponent = ShoePrints;

  static description = "Sets the walkable surface area in your scene.";

  constructor(props) {
    super(props);
    const createPropSetter = propName => value => this.props.editor.setPropertySelected(propName, value);
    this.onChangeAutoCellSize = createPropSetter("autoCellSize");
    this.onChangeCellSize = createPropSetter("cellSize");
    this.onChangeCellHeight = createPropSetter("cellHeight");
    this.onChangeAgentHeight = createPropSetter("agentHeight");
    this.onChangeAgentRadius = createPropSetter("agentRadius");
    this.onChangeAgentMaxClimb = createPropSetter("agentMaxClimb");
    this.onChangeAgentMaxSlope = createPropSetter("agentMaxSlope");
    this.onChangeRegionMinSize = createPropSetter("regionMinSize");
    this.onChangeMaxTriangles = createPropSetter("maxTriangles");
    this.onChangeForceTrimesh = createPropSetter("forceTrimesh");
    this.onChangeNavMeshMode = createPropSetter("navMeshMode");
    this.onChangeNavMeshSrc = createPropSetter("navMeshSrc");
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
    const { node, settings } = this.props;

    return (
      <NodeEditor {...this.props} description={FloorPlanNodeEditor.description}>
        <InputGroup name="Nav Mesh Mode">
          <SelectInput options={NavMeshModeOptions} value={node.navMeshMode} onChange={this.onChangeNavMeshMode} />
        </InputGroup>
        {node.navMeshMode === NavMeshMode.Automatic ? (
          <>
            <InputGroup name="Auto Cell Size">
              <BooleanInput value={node.autoCellSize} onChange={this.onChangeAutoCellSize} />
            </InputGroup>
            {!node.autoCellSize && (
              <NumericInputGroup
                name="Cell Size"
                value={node.cellSize}
                smallStep={0.001}
                mediumStep={0.01}
                largeStep={0.1}
                min={0.1}
                displayPrecision={0.0001}
                onChange={this.onChangeCellSize}
              />
            )}
            <NumericInputGroup
              name="Cell Height"
              value={node.cellHeight}
              smallStep={0.001}
              mediumStep={0.01}
              largeStep={0.1}
              min={0.1}
              onChange={this.onChangeCellHeight}
              unit="m"
            />
            <NumericInputGroup
              name="Agent Height"
              value={node.agentHeight}
              smallStep={0.001}
              mediumStep={0.01}
              largeStep={0.1}
              min={0.1}
              onChange={this.onChangeAgentHeight}
              unit="m"
            />
            <NumericInputGroup
              name="Agent Radius"
              value={node.agentRadius}
              min={0}
              smallStep={0.001}
              mediumStep={0.01}
              largeStep={0.1}
              onChange={this.onChangeAgentRadius}
              unit="m"
            />
            <NumericInputGroup
              name="Maximum Step Height"
              value={node.agentMaxClimb}
              min={0}
              smallStep={0.001}
              mediumStep={0.01}
              largeStep={0.1}
              onChange={this.onChangeAgentMaxClimb}
              unit="m"
            />
            <NumericInputGroup
              name="Maximum Slope"
              value={node.agentMaxSlope}
              min={0.00001}
              max={90}
              smallStep={1}
              mediumStep={5}
              largeStep={15}
              onChange={this.onChangeAgentMaxSlope}
              unit="°"
            />
            <NumericInputGroup
              name="Minimum Region Area"
              value={node.regionMinSize}
              min={0.1}
              smallStep={0.1}
              mediumStep={1}
              largeStep={10}
              onChange={this.onChangeRegionMinSize}
              unit="m²"
            />
          </>
        ) : (
          <InputGroup name="Custom Navmesh Url">
            <ModelInput value={node.navMeshSrc} onChange={this.onChangeNavMeshSrc} />
          </InputGroup>
        )}
        <InputGroup name="Force Trimesh">
          <BooleanInput value={node.forceTrimesh} onChange={this.onChangeForceTrimesh} />
        </InputGroup>
        {!node.forceTrimesh && settings.enableExperimentalFeatures && (
          <NumericInputGroup
            name="Collision Geo Triangle Threshold"
            value={node.maxTriangles}
            min={10}
            max={10000}
            smallStep={1}
            mediumStep={100}
            largeStep={1000}
            precision={1}
            onChange={this.onChangeMaxTriangles}
          />
        )}
        <PropertiesPanelButton onClick={this.onRegenerate}>Regenerate</PropertiesPanelButton>
      </NodeEditor>
    );
  }
}

const FloorPlanNodeEditorContainer = withDialog(withSettings(FloorPlanNodeEditor));
FloorPlanNodeEditorContainer.iconComponent = FloorPlanNodeEditor.iconComponent;
FloorPlanNodeEditorContainer.description = FloorPlanNodeEditor.description;
export default FloorPlanNodeEditorContainer;
