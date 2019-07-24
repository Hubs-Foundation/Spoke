import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import styled from "styled-components";

const StyledNewProjectGridItem = styled(Link)`
  display: flex;
  flex-direction: column;
  height: 220px;
  border-radius: 6px;
  text-decoration: none;
  border: 5px dashed ${props => props.theme.panel};
  justify-content: center;
  align-items: center;

  &:hover {
    color: ${props => props.theme.text};
    border-color: ${props => props.theme.selected};
  }

  i {
    font-size: 3em;
    margin-bottom: 20px;
  }
`;

export default class NewProjectGridItem extends Component {
  static propTypes = {
    newProjectUrl: PropTypes.string.isRequired
  };

  render() {
    return (
      <StyledNewProjectGridItem to={this.props.newProjectUrl}>
        <i className="fas fa-plus" />
        <h3>New Project</h3>
      </StyledNewProjectGridItem>
    );
  }
}
