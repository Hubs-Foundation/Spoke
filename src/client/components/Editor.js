import React from "react";
import PropTypes from "prop-types";
import styles from "./Editor.scss";
import Modal from "react-modal";
import { MosaicWithoutDragDropContext } from "react-mosaic-component";

export default function Editor({ initialPanels, renderPanel, openModal, onCloseModal, onPanelChange }) {
  return (
    <div className={styles.editor}>
      <MosaicWithoutDragDropContext
        className="mosaic-theme"
        renderTile={renderPanel}
        initialValue={initialPanels}
        onChange={onPanelChange}
      />
      <Modal
        ariaHideApp={false}
        isOpen={!!openModal}
        onRequestClose={onCloseModal}
        shouldCloseOnOverlayClick={openModal && openModal.shouldCloseOnOverlayClick}
        className="Modal"
        overlayClassName="Overlay"
      >
        {openModal && <openModal.component {...openModal.props} />}
      </Modal>
    </div>
  );
}

Editor.propTypes = {
  initialPanels: PropTypes.object.isRequired,
  renderPanel: PropTypes.func.isRequired,
  openModal: PropTypes.object,
  onCloseModal: PropTypes.func,
  onPanelChange: PropTypes.func
};
