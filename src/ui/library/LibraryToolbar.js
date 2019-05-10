import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./LibraryToolbar.scss";
import LibraryToolbarItem from "./LibraryToolbarItem";

export default class LibraryToolbar extends Component {
  static propTypes = {
    selected: PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      iconClassName: PropTypes.string.isRequired
    }),
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        iconClassName: PropTypes.string.isRequired
      })
    ).isRequired,
    onSelect: PropTypes.func.isRequired
  };

  render() {
    const { items, selected, onSelect } = this.props;

    return (
      <div className={styles.libraryToolbar}>
        {items.map(item => (
          <LibraryToolbarItem
            key={item.id}
            item={item}
            selected={selected && item.id === selected.id}
            onClick={onSelect}
          />
        ))}
      </div>
    );
  }
}
