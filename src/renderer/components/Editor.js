import React from "react";
import PropTypes from "prop-types";
import styles from "./Editor.scss";
import Modal from "react-modal";
import { Mosaic } from "react-mosaic-component";

export default function Editor(props) {
  return (
    <div className={styles.editor}>
      <Mosaic className="mosaic-theme" renderTile={props.renderPanel} initialValue={props.initialPanels} />
      <Modal
        isOpen={!!props.openModal}
        onRequestClose={props.onCloseModal}
        shouldCloseOnOverlayClick={props.openModal && props.openModal.shouldCloseOnOverlayClick}
      >
        {props.openModal && <props.openModal.component gltfURI={props.gltfURI} onLoadGLTF={props.onLoadGLTF} />}
      </Modal>
    </div>
  );
}

Editor.propTypes = {
  initialPanels: PropTypes.object.isRequired,
  renderPanel: PropTypes.func.isRequired,
  openModal: PropTypes.object,
  onCloseModal: PropTypes.func,
  gltfURI: PropTypes.string,
  onLoadGLTF: PropTypes.func
};
