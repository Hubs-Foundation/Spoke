import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import styled from "styled-components";
import { Plus } from "styled-icons/fa-solid/Plus";

const StyledNewProjectGridItem = styled(Link)`
  display: flex;
  flex-direction: column;
  height: 220px;
  border-radius: 6px;
  text-decoration: none;
  /*border: 5px dashed ${props => props.theme.text};*/
  background-color: ${props => props.theme.toolbar};
  justify-content: center;
  align-items: center;
  border: 1px solid transparent;

  &:hover {
    color: inherit;
    border-color: ${props => props.theme.selected};
  }

  svg {
    width: 3em;
    height: 3em;
    margin-bottom: 20px;
  }
`;

export default class NewProjectGridItem extends Component {
  static propTypes = {
    path: PropTypes.oneOf([PropTypes.string, PropTypes.object]).isRequired,
    label: PropTypes.string.isRequired
  };

  static defaultProps = {
    label: "New Project"
  };

  render() {
    const { path, label } = this.props;

    return (
      <StyledNewProjectGridItem to={path}>
        <Plus />
        <h3>{label}</h3>
      </StyledNewProjectGridItem>
    );
  }
}
