import React, { Fragment, useEffect, useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

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
  const { children, ...rest } = props;
  const [name, setName] = useState(props.name)
  const [description, setDescription] = useState(props.description)
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!props.name && !props.description) return

    const localeData = require(`../../locales/${i18n.language}/renderElements.json`)
    const data = localeData[props.name]

    if (data) {
      setName(data.title)
      setDescription(data.description)
    }
  }, [name, description, i18n.language])

  return (
    <StyledPropertyGroup {...rest}>
      <PropertyGroupHeader>{name ? name : ""}</PropertyGroupHeader>
      {description ? (
        <PropertyGroupDescription>
          {description.split("\\n").map((line, i) => (
            <Fragment key={i}>
              {line}
              <br />
            </Fragment>
          ))}
        </PropertyGroupDescription>
      ): null}
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
