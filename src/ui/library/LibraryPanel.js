import React, { Component } from "react";
import PropTypes from "prop-types";
import LibraryGrid from "./LibraryGrid";
import InfiniteScroll from "react-infinite-scroller";
import LibraryGridScrollContainer from "./LibraryGridScrollContainer";
import styled from "styled-components";

export const LibraryPanelContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.2);
`;

const SearchBar = styled.div`
  display: flex;
  padding: 4px 8px;

  & > * {
    margin-right: 8px;
  }
`;

const LoadingItem = styled.div`
  display: flex;
  flex-direction: column;
  height: 100px;
  border-radius: 6px;
  background-color: rgba(128, 128, 128, 0.5);
  border: 1px solid transparent;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  user-select: none;
`;

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
      <LibraryPanelContainer>
        {children && <SearchBar>{children}</SearchBar>}
        <LibraryGridScrollContainer>
          <InfiniteScroll pageStart={0} loadMore={onLoadMore} hasMore={hasMore} threshold={100} useWindow={false}>
            <LibraryGrid
              items={items}
              onSelect={onSelect}
              tooltipId={tooltipId}
              renderTooltip={renderTooltip}
              renderItem={renderItem}
            >
              {loading && <LoadingItem>Loading...</LoadingItem>}
            </LibraryGrid>
          </InfiniteScroll>
        </LibraryGridScrollContainer>
      </LibraryPanelContainer>
    );
  }
}
