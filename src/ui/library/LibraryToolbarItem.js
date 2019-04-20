import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./LibraryToolbarItem.scss";
import cx from "classnames";

export default class LibraryToolbarItem extends Component {
  static propTypes = {
    selected: PropTypes.bool,
    item: PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      iconClassName: PropTypes.string.isRequired
    }).isRequired,
    onClick: PropTypes.func.isRequired
  };

  onClick = e => {
    this.props.onClick(this.props.item, e);
  };

  render() {
    const { selected, item } = this.props;

    const classNames = cx(styles.libraryToolbarItem, {
      [styles.selected]: selected
    });

    return (
      <div id={`${item.id}-library-btn`} className={classNames} onClick={this.onClick}>
        <i className={`fas ${item.iconClassName}`} />
        <span>{item.label}</span>
      </div>
    );
  }
}
