import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Header.scss";

export default function Header({ icon, title, children }) {
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

Header.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  children: PropTypes.node
};
