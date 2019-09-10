import React from "react";
import RCSlider from "rc-slider/es/Slider";
import { createGlobalStyle } from "styled-components";

const SliderGlobalStyles = createGlobalStyle`
  .rc-slider {
    display: flex;
    flex: 1;
    height: 1px;
    margin-right: 28px;
    position: relative;
    border-radius: 2px;
  }

  .rc-slider-track {
    position: absolute;
    height: 2px;
    background-color: ${props => props.theme.blue};
    border-radius: 2px;
  }

  .rc-slider-rail {
    position: absolute;
    width: calc(100% + 16px);
    height: 2px;
    background-color: ${props => props.theme.border};
    border-radius: 2px;
  }

  .rc-slider-handle {
    position: absolute;
    margin-top: -5px;
    width: 12px;
    height: 12px;
    cursor: pointer;
    border-radius: 50%;
    border: solid 2px ${props => props.theme.white};
    background-color: ${props => props.theme.border};
    touch-action: pan-x;
    outline: none;

      &:hover {
        border: solid 2px ${props => props.theme.blue};
        background-color: ${props => props.theme.white};
      }

      &:active {
        border:  2px solid ${props => props.theme.blue};
        background-color: ${props => props.theme.white};
      }
    }

  .rc-slider-disabled {
    background-color: ${props => props.theme.panel2};
    border-radius: 2px;

    .rc-slider-track {
      background-color: ${props => props.theme.panel2};
    }

    .rc-slider-handle, .rc-slider-dot {
      border-color: ${props => props.theme.panel2};
      box-shadow: none;
      background-color: ${props => props.theme.toolbar};
      cursor: not-allowed;
    }

    .rc-slider-mark-text, .rc-slider-dot {
      cursor: not-allowed!important;
    }
  }
`;

export default function Slider(props) {
  return (
    <>
      <RCSlider {...props} />
      <SliderGlobalStyles />
    </>
  );
}
