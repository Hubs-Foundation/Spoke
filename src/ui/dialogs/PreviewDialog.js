import React from "react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";
import styles from "./PreviewDialog.scss";

export default function PreviewDialog({ imageSrc, children, ...props }) {
  return (
    <Dialog {...props}>
      <div className={styles.leftContent}>
        <img src={imageSrc} />
      </div>
      <div className={styles.rightContent}>{children}</div>
    </Dialog>
  );
}

PreviewDialog.propTypes = {
  imageSrc: PropTypes.string,
  children: PropTypes.node
};
