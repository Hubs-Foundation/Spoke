import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import BooleanInput from "../inputs/BooleanInput";
import FormField from "../inputs/FormField";
import Dialog from "./Dialog";
import styled from "styled-components";

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

export default function ExportProjectDialog({ defaultOptions, onConfirm, onCancel }) {
  const [options, setOptions] = useState(defaultOptions);

  const onChangeCombineMeshes = useCallback(
    combineMeshes => {
      setOptions({ ...options, combineMeshes });
    },
    [options, setOptions]
  );

  const onChangeRemoveUnusedObjects = useCallback(
    removeUnusedObjects => {
      setOptions({ ...options, removeUnusedObjects });
    },
    [options, setOptions]
  );

  const onConfirmCallback = useCallback(
    e => {
      e.preventDefault();
      onConfirm(options);
    },
    [options, onConfirm]
  );

  const onCancelCallback = useCallback(
    e => {
      e.preventDefault();
      onCancel();
    },
    [onCancel]
  );

  return (
    <Dialog
      title="Export Project"
      onConfirm={onConfirmCallback}
      onCancel={onCancelCallback}
      confirmLabel="Export Project"
    >
      <FormContainer>
        <FormField>
          <label htmlFor="combineMeshes">Combine Meshes</label>
          <BooleanInput id="combineMeshes" value={options.combineMeshes} onChange={onChangeCombineMeshes} />
        </FormField>
        <FormField>
          <label htmlFor="removeUnusedObjects">Remove Unused Objects</label>
          <BooleanInput
            id="removeUnusedObjects"
            value={options.removeUnusedObjects}
            onChange={onChangeRemoveUnusedObjects}
          />
        </FormField>
      </FormContainer>
    </Dialog>
  );
}

ExportProjectDialog.propTypes = {
  defaultOptions: PropTypes.object.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};
