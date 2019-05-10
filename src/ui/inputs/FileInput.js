import React, { Component } from "react";
import styles from "./FileInput.scss";
import PropTypes from "prop-types";

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
      <div className={styles.uploadFileButton}>
        <label htmlFor={this.state.id}>{label}</label>
        <input {...rest} id={this.state.id} type="file" onChange={this.onChange} />
      </div>
    );
  }
}
