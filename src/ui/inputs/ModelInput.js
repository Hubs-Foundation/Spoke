import React from "react";
import PropTypes from "prop-types";
import { ControlledStringInput } from "./StringInput";
import { useDrop } from "react-dnd";
import { ItemTypes } from "../dnd";
import useUpload from "../assets/useUpload";
import { ModelFileTypes } from "../assets/fileTypes";

const uploadOptions = {
  multiple: false,
  accepts: ModelFileTypes
};

export default function ModelInput({ onChange, ...rest }) {
  const onUpload = useUpload();
  const [{ canDrop, isOver }, dropRef] = useDrop({
    accept: [ItemTypes.Model, ItemTypes.File],
    drop(item) {
      if (item.type === ItemTypes.Model) {
        onChange(item.value.url, item.value.initialProps || {});
      } else {
        onUpload(item.files, uploadOptions).then(assets => {
          if (assets && assets.length > 0) {
            onChange(assets[0].url, {});
          }
        });
      }
    },
    collect: monitor => ({
      canDrop: monitor.canDrop(),
      isOver: monitor.isOver()
    })
  });

  return (
    <ControlledStringInput
      ref={dropRef}
      onChange={(value, e) => onChange(value, {}, e)}
      error={isOver && !canDrop}
      canDrop={isOver && canDrop}
      {...rest}
    />
  );
}

ModelInput.propTypes = {
  onChange: PropTypes.func.isRequired
};
