import React, { Component } from "react";
import Modal from "react-modal";
import ProjectModalContainer from "./ProjectModalContainer";
import ViewportPanelContainer from "./ViewportPanelContainer";
import Editor from "../components/Editor";

export default class EditorContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      gltfURI: null,
      openModal: {
        component: ProjectModalContainer,
        shouldCloseOnOverlayClick: false
      }
    };
  }

  onLoadGLTF = gltfURI => {
    this.setState({
      openModal: null,
      gltfURI
    });
  };

  onCloseModal = () => {
    this.setState({
      openModal: null
    });
  };

  render() {
    return (
      <Editor>
        <ViewportPanelContainer gltfURI={this.state.gltfURI} />
        <Modal
          isOpen={this.state.openModal !== null}
          onRequestClose={this.onCloseModal}
          shouldCloseOnOverlayClick={this.state.openModal && this.state.openModal.shouldCloseOnOverlayClick}
        >
          {this.state.openModal && (
            <this.state.openModal.component gltfURI={this.state.gltfURI} onLoadGLTF={this.onLoadGLTF} />
          )}
        </Modal>
      </Editor>
    );
  }
}
