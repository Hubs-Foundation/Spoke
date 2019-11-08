import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

const MediaGridItemContainer = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  outline: none;
  overflow: hidden;
  user-select: none;
  text-decoration: none;
  border-radius: ${props => props.borderRadius}px;
  background-color: ${props => props.theme.panel2};
  border: 2px solid ${props => (props.selected ? props.theme.selected : "transparent")};
  cursor: pointer;

  ::before {
    content: "";
    display: inline-block;
    width: 1px;
    height: 0;
    padding-bottom: ${props => (1 / props.aspectRatio) * 100}%;
  }

  :hover,
  :focus {
    color: inherit;
    border-color: ${props => props.theme.blueHover};
  }

  :active {
    border-color: ${props => props.theme.selected};
  }
`;

MediaGridItemContainer.propTypes = {
  aspectRatio: PropTypes.number.isRequired,
  borderRadius: PropTypes.number.isRequired,
  selected: PropTypes.bool
};

MediaGridItemContainer.defaultProps = {
  aspectRatio: 1,
  borderRadius: 6
};

const MediaGridItemContent = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`;

const MediaGridItemThumbnailImage = styled.div`
  display: flex;
  flex: 1;
  background-size: cover;
  background-position: 50%;
  background-repeat: no-repeat;
`;

const MediaGridItemThumbnailVideo = styled.video`
  display: flex;
  flex: 1;
`;

const MediaGridItemIconContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 8px;
  text-align: center;
  overflow: hidden;

  div {
    margin-top: 8px;
    display: block;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 100%;
  }
`;

const MediaGridItemLabelContainer = styled.div`
  padding-top: 4px;
  display: flex;
  justify-content: center;
`;

const MediaGridItemLabel = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export function VideoMediaGridItem({ label, src, ...rest }) {
  return (
    <>
      <MediaGridItemContainer {...rest}>
        <MediaGridItemContent>
          <MediaGridItemThumbnailVideo autoPlay muted src={src} />
        </MediaGridItemContent>
      </MediaGridItemContainer>
      <MediaGridItemLabelContainer>
        <MediaGridItemLabel>{label}</MediaGridItemLabel>
      </MediaGridItemLabelContainer>
    </>
  );
}

VideoMediaGridItem.propTypes = {
  src: PropTypes.string,
  label: PropTypes.string
};

export function ImageMediaGridItem({ label, src, ...rest }) {
  return (
    <>
      <MediaGridItemContainer {...rest}>
        <MediaGridItemContent>
          <MediaGridItemThumbnailImage style={{ backgroundImage: `url(${src})` }} />
        </MediaGridItemContent>
      </MediaGridItemContainer>
      <MediaGridItemLabelContainer>
        <MediaGridItemLabel>{label}</MediaGridItemLabel>
      </MediaGridItemLabelContainer>
    </>
  );
}

ImageMediaGridItem.propTypes = {
  src: PropTypes.string,
  label: PropTypes.string
};

export function IconMediaGridItem({ label, iconComponent: IconComponent, ...rest }) {
  return (
    <>
      <MediaGridItemContainer {...rest}>
        <MediaGridItemContent>
          <MediaGridItemIconContainer>
            <IconComponent size={48} />
          </MediaGridItemIconContainer>
        </MediaGridItemContent>
      </MediaGridItemContainer>
      <MediaGridItemLabelContainer>
        <MediaGridItemLabel>{label}</MediaGridItemLabel>
      </MediaGridItemLabelContainer>
    </>
  );
}

IconMediaGridItem.propTypes = {
  iconComponent: PropTypes.object,
  label: PropTypes.string
};

export const MediaGrid = styled.div`
  display: grid;
  grid-gap: ${props => props.gap};
  width: 100%;
  grid-template-columns: repeat(auto-fill, minmax(${props => props.minWidth}, 1fr));
  padding: ${props => props.gap};
`;

MediaGrid.propTypes = {
  gap: PropTypes.string.isRequired,
  minWidth: PropTypes.string.isRequired
};

MediaGrid.defaultProps = {
  gap: "20px",
  minWidth: "100px"
};
