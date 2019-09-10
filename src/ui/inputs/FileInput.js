import React, { Component } from "react";
import PropTypes from "prop-types";
import { Button } from "./Button";
import Hidden from "../layout/Hidden";

let nextId = 0;

export default class FileInput extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
  };

  static defaultProps = {
    label: "Upload..."
  };

  constructor(props) {
    super(props);

    this.state = {
      id: `file-input-${nextId++}`
    };
  }

  onChange = e => {
    this.props.onChange(e.target.files, e);
  };

  render() {
    const { label, onChange, ...rest } = this.props;

    return (
      <div>
        <Button as="label" htmlFor={this.state.id}>
          {label}
        </Button>
        <Hidden as="input" {...rest} id={this.state.id} type="file" onChange={this.onChange} />
      </div>
    );
  }
}
