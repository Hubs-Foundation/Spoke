import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Icon.scss";
import StringInput from "./inputs/StringInput";

export default function Icon({ name, selected, rename, onClick, onChange, onCancel, onSubmit, className }) {
  const fullClassName = classNames(styles.icon, className, {
    [styles.selected]: selected
  });
  const [fileName, fileExt] = name.split(".");

  return (
    <div className={fullClassName} onMouseDown={onClick}>
      {rename ? (
        <StringInput
          autoFocus={rename}
          className={styles.name}
          value={name}
          onChange={onChange}
          onBlur={onSubmit}
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
        <div>
          <div className={styles.name} title={fileName}>
            {fileName}
          </div>
          <div className={styles.type}>{fileExt}</div>
        </div>
      )}
    </div>
  );
}

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  rename: PropTypes.bool,
  onClick: PropTypes.func,
  onChange: PropTypes.func,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  className: PropTypes.string
};
