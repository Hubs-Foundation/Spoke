import React from "react";
import PropTypes from "prop-types";
import { ControlledStringInput } from "./StringInput";
import { useDrop } from "react-dnd";
import { ItemTypes } from "../dnd";
import useUpload from "../assets/useUpload";
import { AudioFileTypes } from "../assets/fileTypes";

const uploadOptions = {
  multiple: false,
  accepts: AudioFileTypes
};

export default function AudioInput({ onChange, ...rest }) {
  const onUpload = useUpload(uploadOptions);
  const [{ canDrop, isOver }, dropRef] = useDrop({
    accept: [ItemTypes.Audio, ItemTypes.File],
    drop(item) {
      if (item.type === ItemTypes.Audio) {
        onChange(item.value.url, item.value.initialProps || {});
      } else {
        onUpload(item.files).then(assets => {
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
      onChange={onChange}
      error={isOver && !canDrop}
      canDrop={isOver && canDrop}
      {...rest}
    />
  );
}

AudioInput.propTypes = {
  onChange: PropTypes.func.isRequired
};
