import React from "react";
import PropTypes from "prop-types";
import Dialog from "../ui/dialogs/Dialog";
import AuthContainer from "./AuthContainer";
import styles from "./LoginDialog.scss";

export default function LoginDialog({ onConfirm, onSuccess, ...props }) {
  return (
    <Dialog {...props}>
      <div className={styles.container}>
        <AuthContainer onSuccess={onSuccess} />
      </div>
    </Dialog>
  );
}

LoginDialog.propTypes = {
  title: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
};

LoginDialog.defaultProps = {
  title: "Login"
};
