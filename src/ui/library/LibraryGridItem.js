import React, { Component } from "react";
import PropTypes from "prop-types";
import { ContextMenuTrigger } from "react-contextmenu";
import styles from "./LibraryGridItem.scss";

const typeToClassName = {
  image: "fa-image",
  video: "fa-film",
  model: "fa-cubes"
};

function renderItem(item) {
  if (item.images && item.images.preview && item.images.preview.url) {
    return (
      <div className={styles.thumbnailContainer}>
        {item.images && item.images.preview && (
          <div className={styles.thumbnail} style={{ backgroundImage: `url(${item.images.preview.url})` }} />
        )}
      </div>
    );
  }

  const className = item.iconClassName || typeToClassName[item.type];

  return (
    <div className={styles.iconLibraryItem}>
      {className && <i className={`fas ${className}`} />}
      <div>{item.name}</div>
    </div>
  );
}

function collectMenuProps({ item }) {
  return { item };
}

export default class LibraryGridItem extends Component {
  static propTypes = {
    tooltipId: PropTypes.string.isRequired,
    item: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    renderItem: PropTypes.func.isRequired
  };

  static defaultProps = {
    renderItem
  };

  onClick = e => {
    e.preventDefault();
    this.props.onClick(this.props.item, e);
  };

  render() {
    const { item, tooltipId, renderItem } = this.props;

    return (
      <ContextMenuTrigger id={tooltipId} item={item} collect={collectMenuProps} holdToDisplay={-1}>
        <div className={styles.libraryGridItem} onClick={this.onClick} data-tip={item.id} data-for={tooltipId}>
          {renderItem(item)}
        </div>
      </ContextMenuTrigger>
    );
  }
}
