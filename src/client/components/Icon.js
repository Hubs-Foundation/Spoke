import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Icon.scss";
import StringInput from "./StringInput";

export default function Icon({ name, src, selected, rename, onClick, onChange, onCancel, onSubmit, className }) {
  const fullClassName = classNames(styles.icon, className, {
    [styles.selected]: selected
  });

  return (
    <div className={fullClassName} onClick={onClick}>
      <img className={styles.image} src={src} />
      {rename ? (
        <StringInput
          autoFocus={rename}
          className={styles.name}
          value={name}
          onChange={onChange}
          onBlur={onCancel}
          onKeyUp={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit(name);
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
        />
      ) : (
        <div className={styles.name}>{name}</div>
      )}
    </div>
  );
}

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  src: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  rename: PropTypes.bool,
  onClick: PropTypes.func,
  onChange: PropTypes.func,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  className: PropTypes.string
};
