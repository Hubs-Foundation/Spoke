import React, { Component } from "react";
import Modal from "react-modal";
import ProjectModalContainer from "./ProjectModalContainer";

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

  onLoadGltf = gltfURI => {
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
      <div>
        <h1>Editor</h1>
        <Modal
          isOpen={this.state.openModal !== null}
          onRequestClose={this.onCloseModal}
          shouldCloseOnOverlayClick={this.state.openModal && this.state.openModal.shouldCloseOnOverlayClick}
        >
          {this.state.openModal && (
            <this.state.openModal.component gltfURI={this.state.gltfURI} onLoadGltf={this.onLoadGltf} />
          )}
        </Modal>
      </div>
    );
  }
}
