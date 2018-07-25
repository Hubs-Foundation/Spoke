import React from "react";
import styles from "./SystemMessageModalContainer.scss";
import Button from "../Button";
import PropTypes from "prop-types";
import Modal from "react-modal";
import classNames from "classnames";

export default function SystemMessageModalContainer({ messageType, messageContent, isOpen, onRequestClose, actions }) {
  const messageContentByType = {
    error: {
      header: "Cannot Open the File",
      content: [
        "The following file is missing:",
        `Please make sure the file exists and then press "Resolved" to reload the file.`
      ]
    }
  };

  const renderHeader = (type, classes) => {
    if (!isOpen || !(type in messageContentByType)) {
      return;
    }
    return (
      <header className={classes}>
        <h3 className={styles.error}>{messageContentByType[messageType].header}</h3>
      </header>
    );
  };

  const renderContent = (type, messageContent) => {
    if (!(type in messageContentByType) || !isOpen) {
      return;
    }
    const displayContent = messageContentByType[type].content;
    displayContent.splice(1, 0, ...messageContent);
    return <div className={styles.message}>{displayContent.map((sentence, i) => <span key={i}>{sentence}</span>)}</div>;
  };

  const renderActions = actions => {
    if (!actions || !isOpen) {
      return;
    }
    return (
      <div className={styles.actions}>
        {actions.map((action, i) => (
          <Button onClick={action.method} key={i}>
            {action.name}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <Modal
      ariaHideApp={false}
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className={styles.container}
      shouldCloseOnOverlayClick={false}
    >
      {renderHeader(
        messageType,
        classNames({
          header: true,
          error: messageType === "error"
        })
      )}
      {renderContent(messageType, messageContent)}
      {renderActions(actions)}
    </Modal>
  );
}

SystemMessageModalContainer.propTypes = {
  messageType: PropTypes.string,
  messageContent: PropTypes.any,
  isOpen: PropTypes.bool,
  onRequestClose: PropTypes.func,
  actions: PropTypes.array
};
