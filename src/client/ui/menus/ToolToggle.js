import React, { Component } from "react";
import Toggle from "react-toggle";
import PropTypes from "prop-types";

export default class ToolToggle extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isChecked: false,
      title: props.text[0]
    };
  }

  onChange = e => {
    this.setState({
      isChecked: !this.state.isChecked,
      title: this.props.text[!this.state.isChecked]
    });
    // trigger editor stuff
  };

  render() {
    return (
      <label>
        <Toggle defaultChecked={this.state.isChecked} onChange={this.onChange} />
        <span>{this.state.title}</span>
      </label>
    );
  }
}

ToolToggle.propTypes = {
  text: PropTypes.array
};
