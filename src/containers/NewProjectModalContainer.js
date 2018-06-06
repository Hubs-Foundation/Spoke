import React, { Component } from "react";
import PropTypes from "prop-types";
import Header from "../components/Header";
import styles from "./NewProjectModalContainer.scss";
import { uriToPath } from "../api";
import NativeFileInput from "../components/NativeFileInput";

export default class NewProjectModalContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: `New ${props.template.name} Project`,
      dir: props.defaultProjectDir
    };
  }

  onChangeName = e => {
    this.setState({ name: e.target.value });
  };

  onChangeDir = dirUri => {
    this.setState({ dir: dirUri });
  };

  onCancel = e => {
    e.preventDefault();
    this.props.onCancel();
  };

  onSubmit = e => {
    e.preventDefault();
    this.props.onCreate(this.state.name, this.props.template.uri, this.state.dir);
  };

  render() {
    return (
      <div className={styles.newProjectModalContainer}>
        <Header title="New Project" />
        <form onSubmit={this.onSubmit}>
          <label>
            Project Name:
            <input type="text" value={this.state.name} onChange={this.onChangeName} />
          </label>
          <label>
            Directory:
            <NativeFileInput title="Select Project Directory..." value={this.state.dir} onChange={this.onChangeDir} />
            <div>{uriToPath(this.state.dir)}</div>
          </label>
          <button onClick={this.onCancel}>Cancel</button>
          <input type="submit" value="Create" />
        </form>
      </div>
    );
  }
}

NewProjectModalContainer.propTypes = {
  defaultProjectDir: PropTypes.string,
  template: PropTypes.shape({
    name: PropTypes.string.isRequired,
    uri: PropTypes.string.isRequired,
    icon: PropTypes.string
  }),
  onCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};
