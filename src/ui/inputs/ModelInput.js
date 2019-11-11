import React from "react";
import PropTypes from "prop-types";
import StringInput from "./StringInput";
import { useDrop } from "react-dnd";
import { ItemTypes } from "../dnd";

export default function ModelInput({ onChange, ...rest }) {
  const [{ canDrop, isOver }, dropRef] = useDrop({
    accept: [ItemTypes.Model],
    drop(item) {
      onChange(item.value.url, item.value.initialProps || {});
    },
    collect: monitor => ({
      canDrop: monitor.canDrop(),
      isOver: monitor.isOver()
    })
  });

  return (
    <StringInput ref={dropRef} onChange={onChange} error={isOver && !canDrop} canDrop={isOver && canDrop} {...rest} />
  );
}

ModelInput.propTypes = {
  onChange: PropTypes.func.isRequired
};
