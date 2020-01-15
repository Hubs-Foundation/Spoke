import React, { useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import Portal from "./Portal";
import Positioner from "./Positioner";
import Overlay from "./Overlay";

export default function Popover({ children, padding, position, renderContent, disabled, ...rest }) {
  const popoverTriggerRef = useRef();
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [setIsOpen, disabled]);

  const onClose = useCallback(
    e => {
      setIsOpen(false);
      e.stopPropagation();
    },
    [setIsOpen]
  );

  const onPreventClose = useCallback(e => {
    e.stopPropagation();
  }, []);

  const getTargetRef = useCallback(() => {
    return popoverTriggerRef;
  }, [popoverTriggerRef]);

  return (
    <div ref={popoverTriggerRef} onClick={onOpen} {...rest}>
      {children}
      {isOpen && (
        <Portal>
          <Overlay onClick={onClose} />
          <Positioner onClick={onPreventClose} getTargetRef={getTargetRef} padding={padding} position={position}>
            {renderContent({ onClose })}
          </Positioner>
        </Portal>
      )}
    </div>
  );
}

Popover.propTypes = {
  disabled: PropTypes.bool,
  children: PropTypes.node,
  padding: PropTypes.number,
  position: PropTypes.string,
  renderContent: PropTypes.func.isRequired
};
