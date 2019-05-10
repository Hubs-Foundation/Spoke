import React, { Component } from "react";
import LibraryInput from "./LibraryInput";
import VideosLibrary from "../library/VideosLibrary";

export default class VideoInput extends Component {
  render() {
    return <LibraryInput {...this.props} dialogTitle="Select a Video..." component={VideosLibrary} />;
  }
}
