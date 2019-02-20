import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./BooleanInput.scss";

let uniqueId = 0;

export default class BooleanInput extends Component {
  static propTypes = {
    value: PropTypes.bool,
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: false,
    onChange: () => {}
  };

  constructor(props) {
    super(props);
    this.checkboxId = `boolean-input-${uniqueId++}`;
  }

  onChange = e => {
    this.props.onChange(e.target.checked);
  };

  render() {
    const { value, onChange, ...rest } = this.props;

    return (
      <div className={styles.booleanInput}>
        <input {...rest} id={this.checkboxId} type="checkbox" checked={value} onChange={this.onChange} />
        <label htmlFor={this.checkboxId} />
      </div>
    );
  }
}
