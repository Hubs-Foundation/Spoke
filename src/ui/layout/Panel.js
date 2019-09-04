import React, { Component } from "react";
import styled from "styled-components";
import classnames from "classnames";
import PropTypes from "prop-types";

export const PanelContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  border-radius: 4px;
  background-color: ${props => props.theme.panel};
  overflow: hidden;
  user-select: none;
`;

export const PanelToolbar = styled.div`
  display: flex;
  padding: 4px;
  height: 24px;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
`;

export const PanelIcon = styled.div`
  padding-right: 8px;
`;

export const PanelTitle = styled.div``;

export const PanelContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

export default class Panel extends Component {
  static propTypes = {
    icon: PropTypes.string,
    title: PropTypes.string,
    children: PropTypes.node
  };

  render() {
    const { icon, title, children, ...rest } = this.props;

    // .toolbar used for onboarding

    return (
      <PanelContainer {...rest}>
        <PanelToolbar className="toolbar">
          {icon && <PanelIcon className={classnames("fas", icon)} />}
          <PanelTitle>{title}</PanelTitle>
        </PanelToolbar>
        <PanelContent>{children}</PanelContent>
      </PanelContainer>
    );
  }
}
