import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

const TooltipContainer = styled.div`
  display: flex;
  width: 600px;
  padding: 12px 0;
`;

const TooltipThumbnailContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 200px;
  height: 200px;
`;

const TooltipContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  margin-left: 16px;
  div {
    margin-top: 8px;
  }
`;

export default function AssetTooltip({ item }) {
  let thumbnail;

  if (item.thumbnailUrl) {
    thumbnail = <img src={item.thumbnailUrl} />;
  } else if (item.videoUrl) {
    thumbnail = <video src={item.videoUrl} autoPlay muted />;
  } else if (item.iconComponent) {
    const IconComponent = item.iconComponent;
    thumbnail = <IconComponent size={100} />;
  } else {
    thumbnail = <img src={item.src} />;
  }

  return (
    <TooltipContainer>
      <TooltipThumbnailContainer>{thumbnail}</TooltipThumbnailContainer>
      <TooltipContent>
        <b>{item.label}</b>
        {item.attributions && item.attributions.creator && <div>by {item.attributions.creator.name}</div>}
        {item.description && <div>{item.description}</div>}
      </TooltipContent>
    </TooltipContainer>
  );
}

AssetTooltip.propTypes = {
  item: PropTypes.object
};
