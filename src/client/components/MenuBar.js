import React from "react";
import PropTypes from "prop-types";
import styles from "./MenuBar.scss";
import Menu from "./Menu";

const MenuBar = React.forwardRef(({ menus }, ref) => {
  return (
    <div ref={ref} className={styles.menuBar}>
      {menus.map(menu => {
        return <Menu key={menu.name} {...menu} />;
      })}
    </div>
  );
});

MenuBar.propTypes = {
  menus: PropTypes.arrayOf(PropTypes.shape(Menu.propTypes))
};

export default MenuBar;
