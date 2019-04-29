import React, { Component } from "react";
import LibraryInput from "./LibraryInput";
import ModelsLibrary from "../library/ModelsLibrary";

const nodeProps = {
  scaleToFit: true // When you update the model, always scale it
};

export default class ModelInput extends Component {
  render() {
    return (
      <LibraryInput {...this.props} nodeProps={nodeProps} dialogTitle="Select a Model..." component={ModelsLibrary} />
    );
  }
}
