import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Button.scss";

export default function SecondaryButton({ className, children, ...props }) {
  const fullClassName = classNames(styles.button, styles.secondaryButton, className);

  return (
    <button className={fullClassName} {...props}>
      {children}
    </button>
  );
}

SecondaryButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};
