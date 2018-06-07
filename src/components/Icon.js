import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Icon.scss";

export default function Icon({ name, src, selected, onClick, className }) {
  const fullClassName = classNames(styles.icon, className, {
    [styles.selected]: selected
  });

  return (
    <div className={fullClassName} onClick={onClick}>
      <img className={styles.image} src={src} />
      <div className={styles.name}>{name}</div>
    </div>
  );
}

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  src: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string
};
