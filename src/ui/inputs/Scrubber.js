import React, { Component, createRef } from "react";
import PropTypes from "prop-types";
import Portal from "../layout/Portal";
import { getStepSize, clamp, toPrecision } from "../utils";
import styled from "styled-components";
import { ArrowsAltH } from "styled-icons/fa-solid/ArrowsAltH";
import Overlay from "../layout/Overlay";

const ScrubberContainer = styled.div`
  cursor: ew-resize;
  user-select: none;
`;

const Cursor = styled(ArrowsAltH).attrs(({ x, y }) => ({
  style: {
    transform: `translate(${x}px,${y}px)`
  }
}))`
  position: absolute;
  width: 20px;

  path {
    stroke: white;
    stroke-width: 20px;
    fill: black;
  }
`;

class Scrubber extends Component {
  constructor(props) {
    super(props);
    this.scrubberEl = createRef();
    this.state = { isDragging: false, startValue: null, delta: null, mouseX: null, mouseY: null };
  }

  componentWillUnmount() {
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mouseup", this.handleMouseUp);
  }

  handleMouseMove = event => {
    const state = this.state;
    const { smallStep, mediumStep, largeStep, sensitivity, min, max, precision, convertTo, onChange } = this.props;

    if (state.isDragging) {
      const mouseX = state.mouseX + event.movementX;
      const mouseY = state.mouseY + event.movementY;
      const nextDelta = state.delta + event.movementX;
      const stepSize = getStepSize(event, smallStep, mediumStep, largeStep);
      const nextValue = state.startValue + Math.round(nextDelta / sensitivity) * stepSize;
      const clampedValue = clamp(nextValue, min, max);
      const roundedValue = precision ? toPrecision(clampedValue, precision) : clampedValue;
      const finalValue = convertTo(roundedValue);
      onChange(finalValue);
      this.setState({ ...state, delta: nextDelta, mouseX, mouseY });
    }
  };

  handleMouseDown = event => {
    const { convertFrom, value } = this.props;

    this.setState({
      isDragging: true,
      startValue: convertFrom(value),
      delta: 0,
      mouseX: event.clientX,
      mouseY: event.clientY
    });

    this.scrubberEl.current.requestPointerLock();

    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("mouseup", this.handleMouseUp);
  };

  handleMouseUp = () => {
    const { onCommit, onChange, value } = this.props;
    const state = this.state;

    if (state.isDragging) {
      this.setState({ isDragging: false, startValue: null, delta: null, mouseX: null, mouseY: null });

      if (onCommit) {
        onCommit(value);
      } else {
        onChange(value);
      }

      document.exitPointerLock();
    }

    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mouseup", this.handleMouseUp);
  };

  render() {
    const {
      tag,
      children,
      smallStep,
      mediumStep,
      largeStep,
      sensitivity,
      min,
      max,
      precision,
      convertFrom,
      convertTo,
      value,
      onChange,
      onCommit,
      ...rest
    } = this.props;

    const { isDragging, mouseX, mouseY } = this.state;

    return (
      <ScrubberContainer as={tag} ref={this.scrubberEl} onMouseDown={this.handleMouseDown} {...rest}>
        {children}
        {isDragging && (
          <Portal>
            <Overlay pointerEvents="none">
              <Cursor x={mouseX} y={mouseY} />
            </Overlay>
          </Portal>
        )}
      </ScrubberContainer>
    );
  }
}

Scrubber.propTypes = {
  tag: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  smallStep: PropTypes.number.isRequired,
  mediumStep: PropTypes.number.isRequired,
  largeStep: PropTypes.number.isRequired,
  sensitivity: PropTypes.number.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  precision: PropTypes.number,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onCommit: PropTypes.func,
  convertFrom: PropTypes.func.isRequired,
  convertTo: PropTypes.func.isRequired
};

Scrubber.defaultProps = {
  tag: "label",
  smallStep: 0.025,
  mediumStep: 0.1,
  largeStep: 0.25,
  sensitivity: 5,
  min: -Infinity,
  max: Infinity,
  convertFrom: value => value,
  convertTo: value => value
};

export default React.memo(Scrubber);
