import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import styled from "styled-components";
import { Plus } from "styled-icons/fa-solid/Plus";

const ProjectGridItemContainer = styled.div`
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

export class NewProjectGridItem extends Component {
  static propTypes = {
    path: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    label: PropTypes.string.isRequired
  };

  static defaultProps = {
    label: "New Project"
  };

  render() {
    const { path, label } = this.props;

    return (
      <ProjectGridItemContainer as={Link} to={path}>
        <Plus />
        <h3>{label}</h3>
      </ProjectGridItemContainer>
    );
  }
}

export function LoadingProjectGridItem() {
  return (
    <ProjectGridItemContainer>
      <h3>Loading...</h3>
    </ProjectGridItemContainer>
  );
}
