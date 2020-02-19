import React, { Fragment } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

const StyledPropertyGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 100%;
  padding: 12px 0;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const PropertyGroupHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: left;
  font-weight: bold;
  color: ${props => props.theme.text2};
  padding: 0 8px 8px;
  :last-child {
    margin-left: auto;
  }
`;

const PropertyGroupDescription = styled.div`
  background-color: ${props => props.theme.panel};
  color: ${props => props.theme.text2};
  white-space: pre-wrap;
  padding: 0 8px 8px;
`;

const PropertyGroupContent = styled.div`
  display: flex;
  flex-direction: column;
`;

function PropertyGroup(props) {
  const { name, description, children, ...rest } = props;

  return (
    <StyledPropertyGroup {...rest}>
      <PropertyGroupHeader>{name}</PropertyGroupHeader>
      {description && (
        <PropertyGroupDescription>
          {description.split("\\n").map((line, i) => (
            <Fragment key={i}>
              {line}
              <br />
            </Fragment>
          ))}
        </PropertyGroupDescription>
      )}
      <PropertyGroupContent>{children}</PropertyGroupContent>
    </StyledPropertyGroup>
  );
}

PropertyGroup.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node
};

export default PropertyGroup;
