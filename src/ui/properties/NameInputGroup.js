import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../properties/PropertiesPanelContainer.scss";
import InputGroup from "../inputs/InputGroup";
import StringInput from "../inputs/StringInput";

export default class NameInputGroup extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      name: this.props.node.name,
      focused: false
    };
  }

  onUpdateName = name => {
    this.setState({ name });
  };

  onFocus = () => {
    this.setState({
      focused: true,
      name: this.props.node.name
    });
  };

  onBlurName = () => {
    this.setState({ focused: false });

    if (this.props.node.name !== this.state.name) {
      this.props.editor.setNodeProperty(this.props.node, "name", this.state.name);
    }
  };

  onKeyUpName = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      this.props.editor.setNodeProperty(this.props.node, "name", this.state.name);
    }
  };

  render() {
    const name = this.state.focused ? this.state.name : this.props.node.name;

    return (
      <InputGroup className={styles.topBarName} name="Name">
        <StringInput
          value={name}
          onChange={this.onUpdateName}
          onFocus={this.onFocus}
          onBlur={this.onBlurName}
          onKeyUp={this.onKeyUpName}
        />
      </InputGroup>
    );
  }
}
