import React, { Component } from "react";
import styled from "styled-components";
import PropTypes from "prop-types";

export const PanelContainer = styled.div`
  position: relative;
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
  margin-right: 8px;
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
    icon: PropTypes.object,
    title: PropTypes.string,
    children: PropTypes.node,
    toolbarContent: PropTypes.node
  };

  render() {
    const { icon, title, children, toolbarContent, ...rest } = this.props;

    // .toolbar used for onboarding

    return (
      <PanelContainer {...rest}>
        <PanelToolbar className="toolbar">
          {icon && <PanelIcon as={icon} size={12} />}
          <PanelTitle>{title}</PanelTitle>
          {toolbarContent}
        </PanelToolbar>
        <PanelContent>{children}</PanelContent>
      </PanelContainer>
    );
  }
}
