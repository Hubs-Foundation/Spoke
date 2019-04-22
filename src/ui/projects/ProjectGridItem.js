import React, { Component } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import styles from "./ProjectGridItem.scss";
import { showMenu, ContextMenuTrigger } from "react-contextmenu";
import MenuButton from "../inputs/MenuButton";

function collectMenuProps({ project }) {
  return { project };
}

export default class ProjectGridItem extends Component {
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

    const content = (
      <>
        <div className={styles.thumbnailContainer}>
          {project.thumbnailUrl && (
            <div className={styles.thumbnail} style={{ backgroundImage: `url(${project.thumbnailUrl})` }} />
          )}
        </div>
        <div className={styles.titleContainer}>
          <h3>{project.name}</h3>
          {contextMenuId && <MenuButton onClick={this.onShowMenu} className="fas fa-ellipsis-v" />}
        </div>
      </>
    );

    if (contextMenuId) {
      return (
        <Link className={styles.projectGridItem} to={project.url}>
          <ContextMenuTrigger
            attributes={{ className: styles.contextMenuTrigger }}
            id={contextMenuId}
            project={project}
            collect={collectMenuProps}
            holdToDisplay={-1}
          >
            {content}
          </ContextMenuTrigger>
        </Link>
      );
    } else {
      return (
        <Link className={styles.projectGridItem} to={project.url}>
          {content}
        </Link>
      );
    }
  }
}
