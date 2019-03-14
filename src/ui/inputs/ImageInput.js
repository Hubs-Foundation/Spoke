import React, { Component } from "react";
import LibraryInput from "./LibraryInput";
import ImagesLibrary from "../library/ImagesLibrary";

export default class ImageInput extends Component {
  render() {
    return <LibraryInput {...this.props} dialogTitle="Select an Image..." component={ImagesLibrary} />;
  }
}
