import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import SelectInput from "../inputs/SelectInput";
import BooleanInput from "../inputs/BooleanInput";
import StringInput from "../inputs/StringInput";

const componentOptions = [
  {
    label: "video",
    value: "video",
    nodeNames: ["Video"],
    propertyOptions: [{ label: "paused", value: "paused", component: "video", input: BooleanInput, default: false }]
  },
  {
    label: "animation-loop",
    value: "animation-loop",
    nodeNames: ["Model"],
    propertyOptions: [
      { label: "paused", value: "paused", component: "animation-loop", input: BooleanInput, default: false }
    ]
  }
];

export default class TriggerVolumeNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-running";

  constructor(props) {
    super(props);

    this.state = {
      options: []
    };
  }

  onChangeTarget = target => {
    this.props.editor.setNodeProperties(this.props.node, {
      target,
      enterComponent: null,
      enterProperty: null,
      enterValue: null,
      leaveComponent: null,
      leaveProperty: null,
      leaveValue: null
    });
  };

  onChangeEnterComponent = value => {
    const { node, editor } = this.props;
    editor.setNodeProperties(node, {
      enterComponent: value,
      enterProperty: null,
      enterValue: null
    });
  };

  onChangeEnterProperty = (value, option) => {
    const { node, editor } = this.props;
    editor.setNodeProperties(node, {
      enterProperty: value,
      enterValue: option.default !== undefined ? option.default : null
    });
  };

  onChangeEnterValue = value => {
    const { node, editor } = this.props;
    editor.setNodeProperty(node, "enterValue", value);
  };

  onChangeLeaveComponent = value => {
    const { node, editor } = this.props;
    editor.setNodeProperties(node, {
      leaveComponent: value,
      leaveProperty: null,
      leaveValue: null
    });
  };

  onChangeLeaveProperty = (value, option) => {
    const { node, editor } = this.props;
    editor.setNodeProperties(node, {
      leaveProperty: value,
      leaveValue: option.default !== undefined ? option.default : null
    });
  };

  onChangeLeaveValue = value => {
    const { node, editor } = this.props;
    editor.setNodeProperty(node, "leaveValue", value);
  };

  componentDidMount() {
    const options = [];

    const sceneNode = this.props.editor.scene;

    sceneNode.traverse(o => {
      if (o.isNode && o !== sceneNode) {
        options.push({ label: o.name, value: o.uuid, nodeName: o.nodeName });
      }
    });

    this.setState({ options });
  }

  render() {
    const { node } = this.props;

    const targetOption = this.state.options.find(o => o.value === node.target);
    const target = targetOption ? targetOption.value : null;
    const targetNotFound = node.target && target === null;

    const filteredComponentOptions = targetOption
      ? componentOptions.filter(o => o.nodeNames.indexOf(targetOption.nodeName) !== -1)
      : [];
    const enterComponentOption = filteredComponentOptions.find(o => o.value === node.enterComponent);
    const enterComponent = enterComponentOption ? enterComponentOption.value : null;
    const leaveComponentOption = filteredComponentOptions.find(o => o.value === node.leaveComponent);
    const leaveComponent = leaveComponentOption ? leaveComponentOption.value : null;

    const filteredEnterPropertyOptions = enterComponentOption
      ? enterComponentOption.propertyOptions.filter(o => o.component === node.enterComponent)
      : [];
    const enterPropertyOption = filteredEnterPropertyOptions.find(o => o.value === node.enterProperty);
    const enterProperty = enterPropertyOption ? enterPropertyOption.value : null;

    const filteredLeavePropertyOptions = leaveComponentOption
      ? leaveComponentOption.propertyOptions.filter(o => o.component === node.leaveComponent)
      : [];
    const leavePropertyOption = filteredLeavePropertyOptions.find(o => o.value === node.leaveProperty);
    const leaveProperty = leavePropertyOption ? leavePropertyOption.value : null;

    const EnterInput = enterPropertyOption && enterPropertyOption.input;
    const LeaveInput = leavePropertyOption && leavePropertyOption.input;

    return (
      <NodeEditor description="Sets a property on the target object on enter and leave." {...this.props}>
        <InputGroup name="Target">
          <SelectInput
            error={targetNotFound}
            placeholder={targetNotFound ? "Error missing node." : "Select node..."}
            value={node.target}
            onChange={this.onChangeTarget}
            options={this.state.options}
          />
        </InputGroup>
        <InputGroup name="Enter Component">
          <SelectInput
            placeholder={node.enterComponent || "Select component..."}
            value={node.enterComponent}
            onChange={this.onChangeEnterComponent}
            options={filteredComponentOptions}
            disabled={!target}
          />
        </InputGroup>
        <InputGroup name="Enter Property">
          <SelectInput
            placeholder={node.enterProperty || "Select property..."}
            value={node.enterProperty}
            onChange={this.onChangeEnterProperty}
            options={filteredEnterPropertyOptions}
            disabled={!enterComponent}
          />
        </InputGroup>
        <InputGroup name="Enter Value">
          {EnterInput ? (
            <EnterInput
              value={node.enterValue}
              onChange={this.onChangeEnterValue}
              disabled={!(target && enterComponent && enterProperty)}
            />
          ) : (
            <StringInput disabled />
          )}
        </InputGroup>
        <InputGroup name="Leave Component">
          <SelectInput
            placeholder={node.leaveComponent || "Select component..."}
            value={node.leaveComponent}
            onChange={this.onChangeLeaveComponent}
            options={filteredComponentOptions}
            disabled={!target}
          />
        </InputGroup>
        <InputGroup name="Leave Property">
          <SelectInput
            placeholder={node.leaveProperty || "Select property..."}
            value={node.leaveProperty}
            onChange={this.onChangeLeaveProperty}
            options={filteredLeavePropertyOptions}
            disabled={!leaveComponent}
          />
        </InputGroup>
        <InputGroup name="Leave Value">
          {LeaveInput ? (
            <LeaveInput
              value={node.leaveValue}
              onChange={this.onChangeLeaveValue}
              disabled={!(target && leaveComponent && leaveProperty)}
            />
          ) : (
            <StringInput disabled />
          )}
        </InputGroup>
      </NodeEditor>
    );
  }
}
