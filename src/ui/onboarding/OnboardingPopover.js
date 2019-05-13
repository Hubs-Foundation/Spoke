import React, { Component } from "react";
import PropTypes from "prop-types";
import Button from "../inputs/Button";
import Portal from "../layout/Portal";
import styles from "./OnboardingPopover.scss";
import classNames from "classnames";
import getPosition from "evergreen-ui/esm/positioner/src/getPosition";

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

  componentDidUpdate(nextProps) {
    if (this.props.target !== nextProps.target) {
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
        <div className={styles.container} style={{ transform, transformOrigin }}>
          <div className={classNames(styles.popover, styles[position])} ref={this.popoverRef}>
            <div className={styles.content}>{children}</div>
            <div className={styles.bottomNav}>
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
              {!disablePrev && curStepIdx > 0 && (
                <Button secondary onClick={prevStep}>
                  Back
                </Button>
              )}
              {!disableNext && curStepIdx < steps.length - 1 && <Button onClick={nextStep}>Next</Button>}
              {!disableNext && curStepIdx === steps.length - 1 && <Button onClick={nextStep}>Finish</Button>}
            </div>
          </div>
        </div>
      </Portal>
    );
  }
}
