import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

const TooltipContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;

  div {
    margin-top: 8px;
  }
`;

export default function AssetTooltip({ item }) {
  return (
    <TooltipContainer>
      <b>{item.label}</b>
      {item.description && <div>{item.description}</div>}
    </TooltipContainer>
  );
}

AssetTooltip.propTypes = {
  item: PropTypes.object
};
