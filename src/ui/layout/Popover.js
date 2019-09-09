import React, { useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import Portal from "./Portal";
import Positioner from "./Positioner";
import Overlay from "./Overlay";

export default function Popover({ children, padding, position, renderContent, ...rest }) {
  const popoverTriggerRef = useRef();
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  const onClose = useCallback(
    e => {
      setIsOpen(false);
      e.stopPropagation();
    },
    [setIsOpen]
  );

  const onPreventClose = useCallback(e => {
    e.stopPropagation();
  });

  return (
    <div ref={popoverTriggerRef} onClick={onOpen} {...rest}>
      {children}
      {isOpen && (
        <Portal>
          <Overlay onClick={onClose} />
          <Positioner onClick={onPreventClose} targetRef={popoverTriggerRef} padding={padding} position={position}>
            {renderContent({ onClose })}
          </Positioner>
        </Portal>
      )}
    </div>
  );
}

Popover.propTypes = {
  children: PropTypes.node,
  padding: PropTypes.number,
  position: PropTypes.string,
  renderContent: PropTypes.func.isRequired
};
