import React from "react";
import styled from "styled-components";

const ProgressBarContainer = styled.div`
  height: 20px;
  position: relative;
  background: ${props => props.theme.panel2};
  border-radius: 4px;

  & > span {
    display: block;
    height: 100%;
    border-radius: 4px;
    background-color: ${props => props.theme.blue};
    position: relative;
    overflow: hidden;

    &:after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      background-image: linear-gradient(
        -45deg,
        rgba(255, 255, 255, 0.2) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.2) 50%,
        rgba(255, 255, 255, 0.2) 75%,
        transparent 75%,
        transparent
      );
      z-index: 1;
      background-size: 50px 50px;
      animation: move 2s linear infinite;
      border-radius: 4px;
      overflow: hidden;
    }
  }

  & > span > span {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background-image: linear-gradient(
      -45deg,
      rgba(255, 255, 255, 0.2) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.2) 75%,
      transparent 75%,
      transparent
    );
    z-index: 1;
    background-size: 50px 50px;
    animation: move 2s linear infinite;
    border-radius: 4px;
    overflow: hidden;
  }

  @keyframes move {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 50px 50px;
    }
  }
`;

export default function ProgressBar() {
  return (
    <ProgressBarContainer>
      <span>
        <span />
      </span>
    </ProgressBarContainer>
  );
}
