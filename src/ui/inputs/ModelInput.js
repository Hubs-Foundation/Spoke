import React, { Component } from "react";
import LibraryInput from "./LibraryInput";
import ModelsLibrary from "../library/ModelsLibrary";

export default class ModelInput extends Component {
  render() {
    return <LibraryInput {...this.props} dialogTitle="Select a Model..." component={ModelsLibrary} />;
  }
}
