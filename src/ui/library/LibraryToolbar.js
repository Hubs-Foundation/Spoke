import React, { Component } from "react";
import PropTypes from "prop-types";
import LibraryToolbarItem from "./LibraryToolbarItem";
import styled from "styled-components";

const StyledLibraryToolbar = styled.div`
  display: flex;
  height: 32px;
  justify-content: center;
  pointer-events: none;

  & > * {
    pointer-events: all;
  }
`;

export default class LibraryToolbar extends Component {
  static propTypes = {
    selected: PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      iconComponent: PropTypes.object.isRequired
    }),
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        iconComponent: PropTypes.object.isRequired
      })
    ).isRequired,
    onSelect: PropTypes.func.isRequired
  };

  render() {
    const { items, selected, onSelect } = this.props;

    return (
      <StyledLibraryToolbar>
        {items.map(item => (
          <LibraryToolbarItem
            key={item.id}
            item={item}
            selected={selected && item.id === selected.id}
            onClick={onSelect}
          />
        ))}
      </StyledLibraryToolbar>
    );
  }
}
