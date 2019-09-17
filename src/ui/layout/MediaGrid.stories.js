import React from "react";
import { MediaGrid, ImageMediaGridItem } from "./MediaGrid";
import defaultThumbnailUrl from "../../assets/default-thumbnail.png";
import { VerticalScrollContainer } from "./Flex";

export default {
  title: "MediaGrid",
  component: MediaGrid
};

export const mediaGrid = () => (
  <VerticalScrollContainer height={320}>
    <MediaGrid>
      {new Array(25).fill(0).map((_, index) => (
        <ImageMediaGridItem
          key={index}
          tabIndex={index}
          selected={index === 3}
          src={defaultThumbnailUrl}
          label={`Item ${index}`}
        />
      ))}
    </MediaGrid>
  </VerticalScrollContainer>
);
