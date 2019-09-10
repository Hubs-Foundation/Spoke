import React, { Component } from "react";
import Toggle from "react-toggle";
import PropTypes from "prop-types";
import styled, { createGlobalStyle } from "styled-components";

const ToggleStyle = createGlobalStyle`
  .react-toggle {
    touch-action: pan-x;
    display: inline-block;
    position: relative;
    cursor: pointer;
    background-color: transparent;
    border: 0;
    padding: 0;
    user-select: none;
    -webkit-tap-highlight-color: rgba(0,0,0,0);
    -webkit-tap-highlight-color: transparent;
  }

  .react-toggle-screenreader-only {
    border: 0;
    clip: rect(0 0 0 0);
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0;
    position: absolute;
    width: 1px;
  }

  .react-toggle--disabled {
    cursor: not-allowed;
    opacity: 0.5;
    transition: opacity 0.25s;
  }

  .react-toggle-track {
    width: 50px;
    height: 24px;
    padding: 0;
    border-radius: 30px;
    background-color: #4D4D4D;
    transition: all 0.2s ease;
  }

  .react-toggle:hover:not(.react-toggle--disabled) .react-toggle-track {
    background-color: #000000;
  }

  .react-toggle--checked .react-toggle-track {
    background-color: #19AB27;
  }

  .react-toggle--checked:hover:not(.react-toggle--disabled) .react-toggle-track {
    background-color: #128D15;
  }

  .react-toggle-track-check {
    position: absolute;
    width: 14px;
    height: 10px;
    top: 0px;
    bottom: 0px;
    margin-top: auto;
    margin-bottom: auto;
    line-height: 0;
    left: 8px;
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .react-toggle--checked .react-toggle-track-check {
    opacity: 1;
    transition: opacity 0.25s ease;
  }

  .react-toggle-track-x {
    position: absolute;
    width: 10px;
    height: 10px;
    top: 0px;
    bottom: 0px;
    margin-top: auto;
    margin-bottom: auto;
    line-height: 0;
    right: 10px;
    opacity: 1;
    transition: opacity 0.25s ease;
  }

  .react-toggle--checked .react-toggle-track-x {
    opacity: 0;
  }

  .react-toggle-thumb {
    transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1) 0ms;
    position: absolute;
    top: 1px;
    left: 1px;
    width: 22px;
    height: 22px;
    border: 1px solid #4D4D4D;
    border-radius: 50%;
    background-color: #FAFAFA;
    box-sizing: border-box;
    transition: all 0.25s ease;
  }

  .react-toggle--checked .react-toggle-thumb {
    left: 27px;
    border-color: #19AB27;
  }

  .react-toggle--focus .react-toggle-thumb {
    box-shadow: 0px 0px 2px 3px #0099E0;
  }

  .react-toggle:active:not(.react-toggle--disabled) .react-toggle-thumb {
    box-shadow: 0px 0px 5px 5px #0099E0;
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ToggleText = styled.div`
  user-select: none;
`;

const ToggleSwitch = styled(Toggle)`
  margin: 0px 16px;

  &.react-toggle--checked &.react-toggle-track {
    background-color: ${props => props.theme.panel};
  }

  &.react-toggle--checked:hover:not(.react-toggle--disabled) .react-toggle-track {
    background-color: ${props => props.theme.background};
  }

  > .react-toggle-track {
    background-color: ${props => props.theme.panel};

    > .react-toggle-track-check {
      height: 12px;
      width: 12px;
    }

    > .react-toggle-track-x {
      height: 12px;
      width: 12px;
    }
  }

  > .react-toggle-thumb {
    background-color: ${props => props.theme.blue};
    border: none;
    box-shadow: none;
  }
`;

const ToggleOnOff = styled(Toggle)`
  margin: 0px 16px;

  &.react-toggle--checked &.react-toggle-track {
    background-color: ${props => props.theme.panel};
  }

  &.react-toggle--checked:hover:not(.react-toggle--disabled) .react-toggle-track {
    background-color: ${props => props.theme.background};
  }

  &.react-toggle-x:hover:not(.react-toggle--disabled) .react-toggle-track {
    color: ${props => props.theme.panel};
  }

  > .react-toggle-track {
    background-color: ${props => props.theme.panel};

    > .react-toggle-track-check {
      height: 12px;
      width: 12px;
      color: ${props => props.theme.text};
    }

    > .react-toggle-track-x {
      height: 12px;
      width: 12px;
      color: ${props => props.theme.border};
    }
  }

  &.react-toggle--checked .react-toggle-thumb {
    background-color: ${props => props.theme.blue};
  }

  > .react-toggle-thumb {
    background-color: ${props => props.theme.border};
    border: none;
    box-shadow: none;
  }
`;

export default class ToolToggle extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSwitch: props.isSwitch
    };
  }

  onChange = () => {
    this.props.action();
  };

  render() {
    const ToggleComponent = this.props.isSwitch ? ToggleSwitch : ToggleOnOff;

    return (
      <ToggleContainer data-tip={this.props.tooltip} data-for="toolbar" data-delay-show="500" data-place="bottom">
        <ToggleComponent checked={this.props.isChecked} onChange={this.onChange} icons={this.props.icons} />
        {this.props.children ? (
          this.props.children
        ) : (
          <ToggleText>
            <span>{this.props.text[!this.props.isChecked ? 0 : 1]}</span>
          </ToggleText>
        )}
        <ToggleStyle />
      </ToggleContainer>
    );
  }
}

ToolToggle.propTypes = {
  text: PropTypes.array,
  action: PropTypes.func,
  isChecked: PropTypes.bool,
  isSwitch: PropTypes.bool,
  children: PropTypes.node,
  icons: PropTypes.shape({
    checked: PropTypes.object,
    unchecked: PropTypes.object
  }),
  tooltip: PropTypes.string
};
