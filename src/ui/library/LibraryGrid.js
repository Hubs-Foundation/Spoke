import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./LibraryGrid.scss";
import LibraryGridItem from "./LibraryGridItem";
import Tooltip from "react-tooltip";

export default class LibraryGrid extends Component {
  static propTypes = {
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.any.isRequired,
        thumbnailUrl: PropTypes.string
      })
    ).isRequired,
    onSelect: PropTypes.func.isRequired,
    tooltipId: PropTypes.string,
    renderItem: PropTypes.func,
    renderTooltip: PropTypes.func,
    children: PropTypes.node
  };

  static defaultProps = {
    tooltipId: "library",
    renderTooltip: id => id
  };

  componentDidMount() {
    Tooltip.rebuild();
  }

  componentDidUpdate() {
    Tooltip.rebuild();
  }

  render() {
    const { items, onSelect, tooltipId, renderTooltip, renderItem } = this.props;

    return (
      <div className={styles.libraryGrid}>
        {items.map(item => (
          <LibraryGridItem key={item.id} item={item} onClick={onSelect} renderItem={renderItem} tooltipId={tooltipId} />
        ))}
        {this.props.children}
        {renderTooltip && <Tooltip className={styles.tooltip} id={tooltipId} getContent={renderTooltip} />}
      </div>
    );
  }
}
