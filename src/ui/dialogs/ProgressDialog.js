import React from "react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";
import ProgressBar from "../inputs/ProgressBar";
import styled from "styled-components";

const ProgressContainer = styled.div`
  color: ${props => props.theme.text2};
  display: flex;
  flex: 1;
  flex-direction: column;
  /* This forces firefox to give the contents a proper height. */
  overflow: hidden;
  padding: 8px;
`;

const ProgressMessage = styled.div`
  padding-bottom: 24px;
  white-space: pre;
`;

export default function ProgressDialog({ message, onConfirm, cancelable, onCancel, ...props }) {
  return (
    <Dialog onCancel={cancelable ? onCancel : null} {...props}>
      <ProgressContainer>
        <ProgressMessage>{message}</ProgressMessage>
        <ProgressBar />
      </ProgressContainer>
    </Dialog>
  );
}

ProgressDialog.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  cancelable: PropTypes.bool,
  cancelLabel: PropTypes.string,
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func
};

ProgressDialog.defaultProps = {
  title: "Loading...",
  message: "Loading...",
  cancelable: false,
  cancelLabel: "Cancel"
};
