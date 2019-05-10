import React, { Component } from "react";
import PropTypes from "prop-types";
import LibraryGrid from "./LibraryGrid";
import InfiniteScroll from "react-infinite-scroller";
import LibraryGridScrollContainer from "./LibraryGridScrollContainer";
import styles from "./LibraryPanel.scss";

export default class LibraryPanel extends Component {
  static propTypes = {
    children: PropTypes.node,
    items: PropTypes.array.isRequired,
    hasMore: PropTypes.bool,
    loading: PropTypes.bool,
    onLoadMore: PropTypes.func,
    onSelect: PropTypes.func.isRequired,
    tooltipId: PropTypes.string,
    renderTooltip: PropTypes.func,
    renderItem: PropTypes.func
  };

  static defaultProps = {
    hasMore: false,
    loading: false,
    onLoadMore: () => {}
  };

  render() {
    const {
      hasMore,
      onLoadMore,
      children,
      onSelect,
      items,
      loading,
      tooltipId,
      renderTooltip,
      renderItem
    } = this.props;

    return (
      <div className={styles.libraryPanel}>
        {children && <div className={styles.searchBar}>{children}</div>}
        <LibraryGridScrollContainer>
          <InfiniteScroll pageStart={0} loadMore={onLoadMore} hasMore={hasMore} threshold={100} useWindow={false}>
            <LibraryGrid
              items={items}
              onSelect={onSelect}
              tooltipId={tooltipId}
              renderTooltip={renderTooltip}
              renderItem={renderItem}
            >
              {loading && <div className={styles.loadingItem}>Loading...</div>}
            </LibraryGrid>
          </InfiniteScroll>
        </LibraryGridScrollContainer>
      </div>
    );
  }
}
