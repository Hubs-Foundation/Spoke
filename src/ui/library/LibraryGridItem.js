import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./LibraryGridItem.scss";

function renderItem(item) {
  return (
    <div className={styles.thumbnailContainer}>
      {item.images && item.images.preview && (
        <div className={styles.thumbnail} style={{ backgroundImage: `url(${item.images.preview.url})` }} />
      )}
    </div>
  );
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
    this.props.onClick(this.props.item, e);
  };

  render() {
    const { item, tooltipId, renderItem } = this.props;

    return (
      <div className={styles.libraryGridItem} onClick={this.onClick} data-tip={item.id} data-for={tooltipId}>
        {renderItem(item)}
      </div>
    );
  }
}
