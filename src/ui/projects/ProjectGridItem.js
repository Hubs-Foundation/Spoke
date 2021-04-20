import React, { Component } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { showMenu } from "../layout/ContextMenu";
import { MenuButton } from "../inputs/Button";
import StylableContextMenuTrigger from "./StylableContextMenuTrigger";
import { EllipsisV } from "styled-icons/fa-solid/EllipsisV";

function collectMenuProps({ project }) {
  return { project };
}

const StyledProjectGridItem = styled(Link)`
  display: flex;
  flex-direction: column;
  height: 220px;
  border-radius: 6px;
  background-color: ${props => props.theme.toolbar};
  text-decoration: none;
  border: 1px solid transparent;
  position: relative;

  &:hover {
    color: inherit;
    border-color: ${props => props.theme.selected};
  }
`;

const Pill = styled.i`
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 3px 8px;
  background-color: ${props => props.theme.pink};
  color: white;
  border-radius: 6px;
  text-align: center;
`;

const StyledContextMenuTrigger = styled(StylableContextMenuTrigger)`
  display: flex;
  flex-direction: column;
  flex: 1;
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
`;

const TitleContainer = styled.div`
  display: flex;
  height: 50px;
  align-items: center;
  padding: 0 16px;

  h3 {
    font-size: 16px;
  }

  button {
    margin-left: auto;

    svg {
      width: 1em;
      height: 1em;
    }
  }
`;

const ThumbnailContainer = styled.div`
  display: flex;
  flex: 1 0 auto;
  justify-content: center;
  align-items: stretch;
  background-color: ${props => props.theme.panel};
  overflow: hidden;
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
`;

const Thumbnail = styled.div`
  display: flex;
  flex: 1;
  background-size: cover;
  background-position: 50%;
  background-repeat: no-repeat;
  background-image: url(${props => props.src});
`;

const Col = styled.div`
  display: flex;
  flex-direction: column;

  p {
    color: ${props => props.theme.text2};
  }
`;

export class ProjectGridItem extends Component {
  static propTypes = {
    contextMenuId: PropTypes.string,
    project: PropTypes.object.isRequired
  };

  onShowMenu = event => {
    event.preventDefault();
    event.stopPropagation();

    const x = event.clientX || (event.touches && event.touches[0].pageX);
    const y = event.clientY || (event.touches && event.touches[0].pageY);
    showMenu({
      position: { x, y },
      target: event.currentTarget,
      id: this.props.contextMenuId,
      data: {
        project: this.props.project
      }
    });
  };

  render() {
    const { project, contextMenuId } = this.props;
    const creatorAttribution = project.attributions && project.attributions.creator;

    const content = (
      <>
        <ThumbnailContainer>{project.thumbnail_url && <Thumbnail src={project.thumbnail_url} />}</ThumbnailContainer>
        <TitleContainer>
          <Col>
            <h3>{project.name}</h3>
            {creatorAttribution && <p>{creatorAttribution}</p>}
          </Col>
          {contextMenuId && (
            <MenuButton onClick={this.onShowMenu}>
              <EllipsisV />
            </MenuButton>
          )}
        </TitleContainer>
      </>
    );

    if (contextMenuId) {
      return (
        <StyledProjectGridItem to={project.url}>
          <StyledContextMenuTrigger id={contextMenuId} project={project} collect={collectMenuProps} holdToDisplay={-1}>
            {content}
          </StyledContextMenuTrigger>
        </StyledProjectGridItem>
      );
    } else {
      return <StyledProjectGridItem to={project.url}>{content}</StyledProjectGridItem>;
    }
  }
}

export function ProjectGridSceneItem({ scene }) {
  const creatorAttribution = scene.attributions && scene.attributions.creator;
  return (
    <StyledProjectGridItem to={scene.url}>
      <ThumbnailContainer>{scene.screenshot_url && <Thumbnail src={scene.screenshot_url} />}</ThumbnailContainer>
      <TitleContainer>
        <Col>
          <h3>{scene.name}</h3>
          {creatorAttribution && <p>{creatorAttribution}</p>}
        </Col>
        <Pill>GLB</Pill>
      </TitleContainer>
    </StyledProjectGridItem>
  );
}

ProjectGridSceneItem.propTypes = {
  scene: PropTypes.object.isRequired
};
