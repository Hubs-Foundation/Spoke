import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./DialogHeader.scss";

export default function DialogHeader({ icon, title, children }) {
  return (
    <div className={styles.header}>
      <div>
        {icon && <i className={classNames(styles.icon, "fas", icon)} />}
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

DialogHeader.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  children: PropTypes.node
};
