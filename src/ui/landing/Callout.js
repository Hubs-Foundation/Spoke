import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

const StyledCallout = styled.div`
  display: flex;
  flex-direction: column;
  align-content: center;
`;

const ImageContainer = styled.div`
  padding-bottom: 56.25%; /* 16:9 */
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  background-color: ${props => props.theme.panel};
  margin-bottom: 2em;

  img {
    bottom: 0;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  h3 {
    font-size: 2em;
    margin-bottom: 1em;
  }

  p {
    font-size: 1.1em;
    text-align: center;
  }
`;

export default function Callout(props) {
  return (
    <StyledCallout>
      <ImageContainer>
        <img src={props.imageSrc} />
      </ImageContainer>
      <Content>{props.children}</Content>
    </StyledCallout>
  );
}

Callout.propTypes = {
  imageSrc: PropTypes.string,
  children: PropTypes.node
};
