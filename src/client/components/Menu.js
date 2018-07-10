import React from "react";
import PropTypes from "prop-types";
import styles from "./Menu.scss";
import MenuItem from "./MenuItem";

export default function Menu({ name, items, open, onMouseOver, onClick }) {
  return (
    <div className={styles.menu} onMouseOver={onMouseOver} onClick={onClick}>
      {name}
      {open && (
        <div className={styles.dropdown}>
          {items.map(item => {
            return <MenuItem key={item.name} {...item} />;
          })}
        </div>
      )}
    </div>
  );
}

Menu.propTypes = {
  name: PropTypes.string,
  open: PropTypes.bool,
  items: PropTypes.arrayOf(PropTypes.shape(MenuItem.propTypes)),
  onMouseOver: PropTypes.func,
  onClick: PropTypes.func
};
