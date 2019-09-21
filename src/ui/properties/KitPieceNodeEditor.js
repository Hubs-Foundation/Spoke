import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import { PuzzlePiece } from "styled-icons/fa-solid/PuzzlePiece";

export default class KitPieceNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = PuzzlePiece;

  static description = "";

  render() {
    return <NodeEditor {...this.props} description={KitPieceNodeEditor.description} />;
  }
}
