import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./IconGrid.scss";

export default function IconGrid({ icons, onSelect, small }) {
  const containerClassName = classNames(styles.iconGrid, { [styles.small]: small });

  return (
    <div className={containerClassName}>
      {icons.map(icon => {
        const className = classNames(styles.item, { [styles.selected]: icon.selected });

        return (
          <div key={icon.id} onClick={e => onSelect(icon, e)} className={className}>
            <img className={styles.icon} src={icon.src} />
            <div className={styles.name}>{icon.name}</div>
          </div>
        );
      })}
    </div>
  );
}

IconGrid.propTypes = {
  small: PropTypes.bool,
  icons: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      src: PropTypes.string.isRequired,
      selected: PropTypes.bool
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired
};
