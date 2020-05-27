import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { CaretRight } from "styled-icons/fa-solid/CaretRight";
import { CaretDown } from "styled-icons/fa-solid/CaretDown";

const CollapsibleContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px 8px;
`;

const CollapsibleLabel = styled.div`
  color: ${props => props.theme.text2};
  cursor: pointer;
  display: inline-block;

  :hover {
    color: ${props => props.theme.text};
  }
`;

const CollapsibleContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px 8px;
`;

const CollapseIcon = styled.div``;

export default function Collapsible({ label, open, children }) {
  const [collapsed, setCollapsed] = useState(!open);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(collapsed => !collapsed);
  }, [setCollapsed]);

  return (
    <CollapsibleContainer>
      <CollapsibleLabel onClick={toggleCollapsed}>
        <CollapseIcon as={collapsed ? CaretRight : CaretDown} size={14} collapsed={collapsed} />
        {label}
      </CollapsibleLabel>
      {!collapsed && <CollapsibleContent>{children}</CollapsibleContent>}
    </CollapsibleContainer>
  );
}

Collapsible.defaultProps = {
  open: false
};

Collapsible.propTypes = {
  open: PropTypes.bool,
  label: PropTypes.string.isRequired,
  children: PropTypes.node
};
