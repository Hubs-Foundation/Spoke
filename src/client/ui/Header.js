import React from "react";
import PropTypes from "prop-types";
import styles from "./Header.scss";

export default function Header({ title, children }) {
  return (
    <div className={styles.header}>
      <div>{title}</div>
      <div>{children}</div>
    </div>
  );
}

Header.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node
};
