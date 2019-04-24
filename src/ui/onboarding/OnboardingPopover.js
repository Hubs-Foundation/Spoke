import React, { Component } from "react";
import PropTypes from "prop-types";
import Button from "../inputs/Button";
import SecondaryButton from "../inputs/SecondaryButton";
import Portal from "../layout/Portal";
import styles from "./OnboardingPopover.scss";
import classNames from "classnames";

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
    skip: PropTypes.func.isRequired
  };

  static defaultProps = {
    disablePrev: false,
    disableNext: false,
    position: "top",
    padding: 16
  };

  constructor(props) {
    super(props);

    this.el = document.createElement("div");
    this.popoverRef = React.createRef();

    this.state = {
      targetEl: null,
      transform: "translate(0px,0px)"
    };
  }

  componentDidMount() {
    // Popover is rendered in a portal. Wait for react rendering to finish before calculating the position.
    setTimeout(() => {
      const targetEl = document.querySelector(this.props.target);
      this.updatePosition(targetEl);
    });
    window.addEventListener("resize", this.onResize);
  }

  componentDidUpdate(nextProps) {
    if (this.props.target !== nextProps.target) {
      setTimeout(() => {
        const targetEl = document.querySelector(this.props.target);
        this.updatePosition(targetEl);
      });
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
    const popoverWidth = popoverRect.width;
    const popoverHeight = popoverRect.height;
    const targetRect = targetEl.getBoundingClientRect();

    let top = 0;
    let left = 0;

    if (position === "top") {
      top = targetRect.top - popoverHeight - padding;
      left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
    } else if (position === "left") {
      top = targetRect.top + targetRect.height / 2 - popoverHeight / 2;
      left = targetRect.left - popoverWidth - padding;
    } else if (position === "right") {
      top = targetRect.top + targetRect.height / 2 - popoverHeight / 2;
      left = targetRect.right + padding;
    } else if (position === "bottom") {
      top = targetRect.bottom + padding;
      left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
    }

    top = Math.round(top);
    left = Math.round(left);

    this.setState({
      targetEl,
      transform: `translate(${left}px,${top}px)`
    });
  }

  render() {
    const { transform } = this.state;
    const { position, children, steps, curStepIdx, prevStep, disablePrev, nextStep, disableNext, skip } = this.props;

    return (
      <Portal>
        <div className={styles.container} style={{ transform }}>
          <div className={classNames(styles.popover, styles[position])} ref={this.popoverRef}>
            <div className={styles.content}>{children}</div>
            <div className={styles.bottomNav}>
              <a
                href="#"
                onClick={e => {
                  e.preventDefault();
                  skip();
                }}
              >
                Skip Tutorial
              </a>
              {!disablePrev && curStepIdx > 0 && <SecondaryButton onClick={prevStep}>Back</SecondaryButton>}
              {!disableNext && curStepIdx < steps.length - 1 && <Button onClick={nextStep}>Next</Button>}
              {!disableNext && curStepIdx === steps.length - 1 && <Button onClick={nextStep}>Finish</Button>}
            </div>
          </div>
        </div>
      </Portal>
    );
  }
}
