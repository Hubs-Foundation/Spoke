import React, { Component } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

export const selectedClassName = "selected-library-toolbar-item";

const StyledLibraryToolbarItem = styled.div`
  color: ${props => props.theme.text};
  background-color: ${props => (props.selected ? props.theme.selected : props.theme.toolbar)};
  border-top: 1px solid ${props => props.theme.panel2};
  border-right: 1px solid ${props => props.theme.panel2};
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 16px;
  cursor: pointer;
  overflow: hidden;
  user-select: none;

  i {
    margin-right: 8px;
  }

  &:first-child {
    border-top-left-radius: 6px;
    border-left: 1px solid ${props => props.theme.panel2};
  }

  &:last-child {
    border-top-right-radius: 6px;
  }
`;

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

    return (
      <StyledLibraryToolbarItem
        id={`${item.id}-library-btn`}
        className={selected && selectedClassName}
        selected={selected}
        onClick={this.onClick}
      >
        <i className={`fas ${item.iconClassName}`} />
        <span>{item.label}</span>
      </StyledLibraryToolbarItem>
    );
  }
}
