import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import SelectInput from "../inputs/SelectInput";
import BooleanInput from "../inputs/BooleanInput";

const componentOptions = [
  { label: "video", value: "video", nodeNames: ["Video"] },
  { label: "animation-loop", value: "animation-loop", nodeNames: ["Model"] }
];

const propertyOptions = [
  { label: "paused", value: "paused", component: "video", input: BooleanInput },
  { label: "paused", value: "paused", component: "animation-loop", input: BooleanInput }
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

  onChangeEnterProperty = value => {
    const { node, editor } = this.props;
    editor.setNodeProperties(node, {
      enterProperty: value,
      enterValue: null
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

  onChangeLeaveProperty = value => {
    const { node, editor } = this.props;
    editor.setNodeProperties(node, {
      leaveProperty: value,
      leaveValue: null
    });
  };

  onChangeLeaveValue = value => {
    const { node, editor } = this.props;
    editor.setNodeProperty(node, "leaveValue", value);
  };

  componentDidMount() {
    const options = [];

    this.props.editor.scene.traverse(o => {
      if (o.isNode) {
        options.push({ label: o.name, value: o.name, nodeName: o.nodeName });
      }
    });

    this.setState({ options });
  }

  render() {
    const { node } = this.props;

    const nodeOption = this.state.options.find(o => o.value === node.target);
    const filteredComponentOptions = nodeOption
      ? componentOptions.filter(o => o.nodeNames.indexOf(nodeOption.nodeName) !== -1)
      : [];
    const filteredEnterPropertyOptions = node.enterComponent
      ? propertyOptions.filter(o => o.component === node.enterComponent)
      : [];
    const filteredLeavePropertyOptions = node.leaveComponent
      ? propertyOptions.filter(o => o.component === node.leaveComponent)
      : [];
    const enterPropertyOption = node.enterProperty ? propertyOptions.find(o => o.value === node.enterProperty) : null;
    const leavePropertyOption = node.leaveProperty ? propertyOptions.find(o => o.value === node.leaveProperty) : null;
    const EnterInput = enterPropertyOption && enterPropertyOption.input;
    const LeaveInput = leavePropertyOption && leavePropertyOption.input;

    return (
      <NodeEditor description="Sets a property on the target object on enter and leave." {...this.props}>
        <InputGroup name="Target">
          <SelectInput value={node.target} onChange={this.onChangeTarget} options={this.state.options} />
        </InputGroup>
        {node.target !== null && (
          <InputGroup name="Enter Component">
            <SelectInput
              value={node.enterComponent}
              onChange={this.onChangeEnterComponent}
              options={filteredComponentOptions}
            />
          </InputGroup>
        )}
        {node.enterComponent !== null && (
          <InputGroup name="Enter Property">
            <SelectInput
              value={node.enterProperty}
              onChange={this.onChangeEnterProperty}
              options={filteredEnterPropertyOptions}
            />
          </InputGroup>
        )}
        {EnterInput && (
          <InputGroup name="Enter Value">
            <EnterInput value={node.enterValue} onChange={this.onChangeEnterValue} />
          </InputGroup>
        )}
        {node.target !== null && (
          <InputGroup name="Leave Component">
            <SelectInput
              value={node.leaveComponent}
              onChange={this.onChangeLeaveComponent}
              options={filteredComponentOptions}
            />
          </InputGroup>
        )}
        {node.leaveComponent !== null && (
          <InputGroup name="Leave Property">
            <SelectInput
              value={node.leaveProperty}
              onChange={this.onChangeLeaveProperty}
              options={filteredLeavePropertyOptions}
            />
          </InputGroup>
        )}
        {LeaveInput && (
          <InputGroup name="Leave Value">
            <LeaveInput value={node.leaveValue} onChange={this.onChangeLeaveValue} />
          </InputGroup>
        )}
      </NodeEditor>
    );
  }
}
