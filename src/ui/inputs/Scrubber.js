import React, { useState, useEffect, useCallback, useRef } from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import Portal from "../layout/Portal";
import styles from "./Scrubber.scss";
import { getStepSize, clamp, toPrecision } from "../utils";

function Scrubber({
  tag: Container,
  children,
  className,
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
}) {
  const scrubberEl = useRef(null);

  const [state, setState] = useState({ isDragging: false, startValue: null, delta: null, mouseX: null, mouseY: null });

  const handleMouseMove = useCallback(
    event => {
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
        setState({ ...state, delta: nextDelta, mouseX, mouseY });
      }
    },
    [
      state.isDragging,
      state.delta,
      state.startValue,
      state.mouseX,
      state.mouseY,
      sensitivity,
      smallStep,
      mediumStep,
      largeStep,
      min,
      max,
      precision,
      convertTo
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (state.isDragging) {
      setState({ isDragging: false, startValue: null, delta: null, mouseX: null, mouseY: null });

      if (onCommit) {
        onCommit(value);
      } else {
        onChange(value);
      }

      document.exitPointerLock();
    }
  }, [state.isDragging, value]);

  const handleMouseDown = useCallback(
    event => {
      setState({
        isDragging: true,
        startValue: convertFrom(value),
        delta: 0,
        mouseX: event.clientX,
        mouseY: event.clientY
      });
      scrubberEl.current.requestPointerLock();
    },
    [value, scrubberEl, convertFrom]
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <Container
      {...rest}
      ref={scrubberEl}
      className={classNames(styles.scrubber, className)}
      onMouseDown={handleMouseDown}
    >
      {children}
      {state.isDragging && (
        <Portal>
          <div className={styles.cursorContainer}>
            <div className={styles.cursor} style={{ transform: `translate(${state.mouseX}px,${state.mouseY}px)` }} />
          </div>
        </Portal>
      )}
    </Container>
  );
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
