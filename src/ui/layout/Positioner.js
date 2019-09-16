import React, { useState, useRef, useEffect, Children, cloneElement } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import getPosition from "evergreen-ui/esm/positioner/src/getPosition";

const PositionerContainer = styled.div.attrs(({ transform, transformOrigin, opacity }) => ({
  style: {
    transform,
    transformOrigin,
    opacity
  }
}))`
  position: fixed;
  top: 0;
  left: 0;
`;

export default function Positioner({ children, position, padding, getTargetRef, ...rest }) {
  const positionerContainerRef = useRef();

  const [transformProps, setTransformProps] = useState({
    finalPosition: position,
    transform: "translate(0px,0px)",
    transformOrigin: "initial",
    opacity: 0
  });

  useEffect(() => {
    const onReposition = () => {
      const positionerContainerRect = positionerContainerRef.current.getBoundingClientRect();
      const targetRect = getTargetRef().current.getBoundingClientRect();
      const viewportHeight = document.documentElement.clientHeight;
      const viewportWidth = document.documentElement.clientWidth;

      const { rect, position: finalPosition, transformOrigin } = getPosition({
        position,
        targetRect,
        targetOffset: padding,
        dimensions: { width: positionerContainerRect.width, height: positionerContainerRect.height },
        viewport: { width: viewportWidth, height: viewportHeight },
        viewportOffset: padding
      });

      setTransformProps({
        finalPosition,
        transformOrigin,
        transform: `translate(${rect.left}px, ${rect.top}px)`,
        opacity: 1
      });
    };

    onReposition();

    window.addEventListener("resize", onReposition);

    return () => {
      window.removeEventListener("resize", onReposition);
    };
  }, [position, padding, getTargetRef, setTransformProps]);

  const childrenWithProps = Children.map(children, child =>
    cloneElement(child, { position: transformProps.finalPosition })
  );

  return (
    <PositionerContainer {...rest} {...transformProps} ref={positionerContainerRef}>
      {childrenWithProps}
    </PositionerContainer>
  );
}

Positioner.propTypes = {
  children: PropTypes.node,
  position: PropTypes.string,
  padding: PropTypes.number,
  getTargetRef: PropTypes.func
};

Positioner.defaultProps = {
  padding: 8,
  position: "bottom"
};
