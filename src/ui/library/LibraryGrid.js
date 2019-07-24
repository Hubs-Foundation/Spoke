import React, { Component } from "react";
import PropTypes from "prop-types";
import LibraryGridItem from "./LibraryGridItem";
import Tooltip from "react-tooltip";
import { unique } from "../utils";
import styled from "styled-components";

const StyledLibraryGrid = styled.div`
  display: grid;
  grid-gap: 10px;
  width: 100%;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  padding: 10px;
`;

const StyledTooltip = styled(Tooltip)`
  max-width: 200px;
  overflow: hidden;
  overflow-wrap: break-word;
  user-select: none;
`;

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
      <StyledLibraryGrid>
        {unique(items, "id").map(item => (
          <LibraryGridItem key={item.id} item={item} onClick={onSelect} renderItem={renderItem} tooltipId={tooltipId} />
        ))}
        {this.props.children}
        {renderTooltip && <StyledTooltip id={tooltipId} getContent={renderTooltip} />}
      </StyledLibraryGrid>
    );
  }
}
