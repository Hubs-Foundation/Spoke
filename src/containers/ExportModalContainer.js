import React, { Component } from "react";
import Header from "../components/Header";
import NativeFileInput from "../components/NativeFileInput";
import { uriToPath, runGLTFBundle } from "../api";
import { withProject } from "./ProjectContext";
import PropTypes from "prop-types";

class ExportModalContainer extends Component {
  static propTypes = {
    sceneURI: PropTypes.string,
    project: PropTypes.any,
    onCloseModal: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      dir: props.project.uri
    };
  }

  onChangeDir = dirUri => {
    this.setState({ dir: dirUri });
  };

  onCancel = e => {
    e.preventDefault();
    this.props.onCloseModal();
  };

  onSubmit = async e => {
    e.preventDefault();
    await runGLTFBundle(this.props.sceneURI, this.state.dir);
    this.props.onCloseModal();
  };

  render() {
    return (
      <div>
        <Header title="Export Scene" />
        <form onSubmit={this.onSubmit}>
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

export default withProject(ExportModalContainer);
