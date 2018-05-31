import React from "react";
import PropTypes from "prop-types";
import styles from "./IconGrid.scss";

export default function IconGrid({ items }) {
  return (
    <div className={styles.iconGrid}>
      {items.map(({ id, name, icon, onClick }) => (
        <div key={id} onClick={onClick} className={styles.item}>
          <img className={styles.icon} src={icon} />
          <div className={styles.name}>{name}</div>
        </div>
      ))}
    </div>
  );
}

IconGrid.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      icon: PropTypes.string,
      onClick: PropTypes.func
    })
  ).isRequired
};
