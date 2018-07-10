import React, { Component } from "react";
import Header from "../Header";
import NativeFileInput from "../inputs/NativeFileInput";
import { withProject } from "../contexts/ProjectContext";
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
    await this.props.project.export(this.props.sceneURI, this.state.dir);
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
            <div>{this.state.dir}</div>
          </label>
          <button onClick={this.onCancel}>Cancel</button>
          <input type="submit" value="Create" />
        </form>
      </div>
    );
  }
}

export default withProject(ExportModalContainer);
