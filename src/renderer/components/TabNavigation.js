import React from "react";
import PropTypes from "prop-types";
import styles from "./TabNavigation.scss";
import classNames from "classnames";

console.log(styles);

function Tab({ children, selected, onClick }) {
  const className = classNames(styles.tab, {
    [styles.selected]: selected
  });

  return (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  );
}

Tab.propTypes = {
  children: PropTypes.string,
  selected: PropTypes.bool,
  onClick: PropTypes.func
};

export default function TabNavigation({ tabs }) {
  return (
    <div className={styles.tabNavigation}>
      {tabs.map(({ selected, name, onClick }) => (
        <Tab key={name} selected={selected} onClick={onClick}>
          {name}
        </Tab>
      ))}
    </div>
  );
}

TabNavigation.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      selected: PropTypes.bool,
      onClick: PropTypes.func,
      name: PropTypes.string
    })
  )
};
