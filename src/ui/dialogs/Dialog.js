import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { Button, SecondaryButton } from "../inputs/Button";
import styled from "styled-components";

const DialogContainer = styled.form`
  display: flex;
  flex-direction: column;
  flex: 1;
  border-radius: 4px;
  background-color: #282c31;
  max-width: 800px;
  min-width: 400px;
  min-height: 150px;
  max-height: 80vh;
`;

const DialogHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 0 8px;
  font-size: 12px;
  overflow: hidden;
  height: 32px;
  background: black;
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;

  > * {
    display: flex;
    align-items: center;
  }
`;

export const DialogContent = styled.div`
  color: ${props => props.theme.text2};
  display: flex;
  flex: 1;
  flex-direction: row;
  /* This forces firefox to give the contents a proper height. */
  overflow: hidden;
  padding: 8px;
  min-height: 100px;

  h1 {
    font-size: 2em;
    color: ${props => props.theme.text};
    margin-bottom: 16px;
  }

  p {
    margin-bottom: 12px;
    line-height: 1.5em;
  }
`;

const DialogBottomNav = styled.div`
  display: flex;
  height: 64px;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  background-color: black;
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: inherit;
  padding: 8px;

  a {
    color: ${props => props.theme.text2};
  }

  button {
    min-width: 84px;
  }

  & > * {
    margin: 0 8px;
  }
`;

export default function Dialog({
  tag,
  title,
  onCancel,
  cancelLabel,
  onConfirm,
  confirmLabel,
  bottomNav,
  children,
  ...rest
}) {
  const onSubmitForm = useCallback(
    e => {
      e.preventDefault();

      if (onConfirm) {
        onConfirm(e);
      }
    },
    [onConfirm]
  );

  return (
    <DialogContainer as={tag} onSubmit={onSubmitForm} {...rest}>
      <DialogHeader>
        <span>{title}</span>
      </DialogHeader>
      <DialogContent>{children}</DialogContent>
      {(onConfirm || onCancel || bottomNav) && (
        <DialogBottomNav>
          {bottomNav}
          {onCancel && <SecondaryButton onClick={onCancel}>{cancelLabel}</SecondaryButton>}
          {onConfirm && (
            <Button type="submit" onClick={tag === "form" ? null : onConfirm}>
              {confirmLabel}
            </Button>
          )}
        </DialogBottomNav>
      )}
    </DialogContainer>
  );
}

Dialog.propTypes = {
  tag: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  cancelLabel: PropTypes.string.isRequired,
  onConfirm: PropTypes.func,
  confirmLabel: PropTypes.string.isRequired,
  bottomNav: PropTypes.node,
  children: PropTypes.node
};

Dialog.defaultProps = {
  tag: "form",
  confirmLabel: "Ok",
  cancelLabel: "Cancel"
};
