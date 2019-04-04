import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Button.scss";

export default function MenuButton({ className, children, ...props }) {
  const fullClassName = classNames(styles.button, styles.menuButton, className);

  return (
    <button className={fullClassName} {...props}>
      {children}
    </button>
  );
}

MenuButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};
