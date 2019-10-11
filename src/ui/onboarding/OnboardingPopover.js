import React, { Component } from "react";
import PropTypes from "prop-types";
import { Button, SecondaryButton } from "../inputs/Button";
import Portal from "../layout/Portal";
import getPosition from "evergreen-ui/esm/positioner/src/getPosition";
import styled, { css } from "styled-components";

const TransformContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
`;

const PositionStyles = {
  left: css`
    &:after {
      left: 100%;
      top: 50%;
      border-left-color: #006eff;
      margin-top: -8px;
    }
  `,

  right: css`
    &:after {
      right: 100%;
      top: 50%;
      border-right-color: #006eff;
      margin-top: -8px;
    }
  `,

  top: css`
    &:after {
      top: 100%;
      left: 50%;
      border-top-color: #000000;
      margin-left: -8px;
    }
  `,

  "top-right": css`
    &:after {
      top: 100%;
      left: 10%;
      border-top-color: #000000;
      margin-left: -8px;
    }
  `,

  "top-left": css`
    &:after {
      top: 100%;
      left: 90%;
      border-top-color: #000000;
      margin-left: -8px;
    }
  `,

  bottom: css`
    &:after {
      bottom: 100%;
      left: 50%;
      border-bottom-color: #006eff;
      margin-left: -8px;
    }
  `,

  "bottom-left": css`
    &:after {
      bottom: 100%;
      left: 0;
      border-bottom-color: #006eff;
      margin-left: 12px;
    }
  `,

  "bottom-right": css`
    &:after {
      bottom: 100%;
      left: 90%;
      border-bottom-color: #006eff;
      margin-left: -8px;
    }
  `
};

const Popover = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: all;
  background-color: #006eff;
  border-radius: 4px;
  border-color: #000000;
  border-width: 1px;
  max-width: 360px;

  &:after {
    border: solid transparent;
    content: " ";
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
    border-color: rgba(0, 0, 0, 0);
    border-width: 8px;
  }

  ${props => PositionStyles[props.position]}
`;

const PopoverContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 30px;

  h1 {
    font-size: 3em;
    font-weight: lighter;
    margin-bottom: 16px;
  }

  h2 {
    color: ${props => props.theme.text2};
    margin-bottom: 8px;
  }

  p {
    margin-bottom: 12px;
    line-height: 1.5em;
  }
`;

const PopoverNav = styled.div`
  display: flex;
  height: 50px;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  background-color: black;
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: inherit;
  padding: 8px;

  a {
    color: ${props => props.theme.text2};
  }

  button {
    width: 84px;
  }

  & > * {
    margin: 0 8px;
  }
`;

export default class OnboardingPopover extends Component {
  static propTypes = {
    target: PropTypes.string.isRequired,
    padding: PropTypes.number.isRequired,
    position: PropTypes.string.isRequired,
    children: PropTypes.node,
    steps: PropTypes.array.isRequired,
    curStepIdx: PropTypes.number.isRequired,
    disablePrev: PropTypes.bool.isRequired,
    disableNext: PropTypes.bool.isRequired,
    nextStep: PropTypes.func.isRequired,
    prevStep: PropTypes.func.isRequired,
    disableSkip: PropTypes.bool.isRequired,
    skip: PropTypes.func.isRequired
  };

  static defaultProps = {
    disablePrev: false,
    disableNext: false,
    disableSkip: false,
    position: "top",
    padding: 16
  };

  constructor(props) {
    super(props);

    this.el = document.createElement("div");
    this.popoverRef = React.createRef();

    this.state = {
      targetEl: null,
      finalPosition: props.position,
      transform: "translate(0px,0px)",
      transformOrigin: "initial"
    };
  }

  componentDidMount() {
    const targetEl = document.querySelector(this.props.target);
    this.updatePosition(targetEl);
    window.addEventListener("resize", this.onResize);
  }

  componentDidUpdate(prevProps) {
    if (this.props.target !== prevProps.target) {
      const targetEl = document.querySelector(this.props.target);
      this.updatePosition(targetEl);
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize);
  }

  onResize = () => {
    this.updatePosition(this.state.targetEl);
  };

  updatePosition(targetEl) {
    if (!targetEl) return;

    const { position, padding } = this.props;
    const popoverRect = this.popoverRef.current.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const viewportHeight = document.documentElement.clientHeight;
    const viewportWidth = document.documentElement.clientWidth;

    const { rect, position: finalPosition, transformOrigin } = getPosition({
      position,
      targetRect,
      targetOffset: padding,
      dimensions: { width: popoverRect.width, height: popoverRect.height },
      viewport: { width: viewportWidth, height: viewportHeight },
      viewportOffset: padding
    });

    this.setState({
      finalPosition,
      transformOrigin,
      transform: `translate(${rect.left}px, ${rect.top}px)`
    });
  }

  render() {
    const { transform, transformOrigin } = this.state;
    const {
      position,
      children,
      steps,
      curStepIdx,
      prevStep,
      disablePrev,
      nextStep,
      disableNext,
      skip,
      disableSkip
    } = this.props;

    return (
      <Portal>
        <TransformContainer style={{ transform, transformOrigin }}>
          <Popover position={position} ref={this.popoverRef}>
            <PopoverContent>{children}</PopoverContent>
            <PopoverNav>
              {!disableSkip && (
                <a
                  href=""
                  onClick={e => {
                    e.preventDefault();
                    e.target.blur();
                    skip();
                  }}
                >
                  Skip Tutorial
                </a>
              )}
              {!disablePrev && curStepIdx > 0 && <SecondaryButton onClick={prevStep}>Back</SecondaryButton>}
              {!disableNext && curStepIdx < steps.length - 1 && <Button onClick={nextStep}>Next</Button>}
              {!disableNext && curStepIdx === steps.length - 1 && <Button onClick={nextStep}>Finish</Button>}
            </PopoverNav>
          </Popover>
        </TransformContainer>
      </Portal>
    );
  }
}
