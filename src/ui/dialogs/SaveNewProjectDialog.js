import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import StringInput from "../inputs/StringInput";
import FormField from "../inputs/FormField";
import PreviewDialog from "./PreviewDialog";

export default function SaveNewProjectDialog({ thumbnailUrl, initialName, onConfirm, onCancel }) {
  const [name, setName] = useState(initialName);

  const onChangeName = useCallback(
    value => {
      setName(value);
    },
    [setName]
  );

  const onConfirmCallback = useCallback(
    e => {
      e.preventDefault();
      onConfirm({ name });
    },
    [name, onConfirm]
  );

  const onCancelCallback = useCallback(
    e => {
      e.preventDefault();
      onCancel();
    },
    [onCancel]
  );

  return (
    <PreviewDialog
      imageSrc={thumbnailUrl}
      title="Save Project"
      onConfirm={onConfirmCallback}
      onCancel={onCancelCallback}
      confirmLabel="Save Project"
    >
      <FormField>
        <label htmlFor="name">Project Name</label>
        <StringInput
          id="name"
          required
          pattern={"[A-Za-z0-9-':\"!@#$%^&*(),.?~ ]{4,64}"}
          title="Name must be between 4 and 64 characters and cannot contain underscores"
          value={name}
          onChange={onChangeName}
        />
      </FormField>
    </PreviewDialog>
  );
}

SaveNewProjectDialog.propTypes = {
  thumbnailUrl: PropTypes.string.isRequired,
  initialName: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};
