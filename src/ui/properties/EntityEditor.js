import React, { useCallback, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { StyledSelectInput } from "../inputs/SelectInput";
import InputGroup from "../inputs/InputGroup";
import PropertyGroup from "./PropertyGroup";

const getRegisteredComponentLabel = componentInfo => componentInfo.name;
const getRegisteredComponentValue = componentInfo => componentInfo.id;

function AddComponentInput({ editor, node, onAdd }) {
  const options = editor.registeredComponents.filter(
    ({ Component, canAdd }) => canAdd && !node.entity.hasComponent(Component)
  );

  const onChange = useCallback(
    ({ Component, defaultProps }, { action }) => {
      if (action === "select-option") {
        node.entity.addComponent(Component, defaultProps);
        onAdd(Component);
      }
    },
    [node, onAdd]
  );

  return (
    <StyledSelectInput
      placeholder="Add Component..."
      value="Add Component"
      onChange={onChange}
      options={options}
      getOptionValue={getRegisteredComponentValue}
      getOptionLabel={getRegisteredComponentLabel}
    />
  );
}

AddComponentInput.propTypes = {
  node: PropTypes.object,
  editor: PropTypes.object,
  onAdd: PropTypes.func
};

function UnknownPropTypeInput() {
  return "Unknown Type";
}

UnknownPropTypeInput.propTypes = {
  propName: PropTypes.string
};

function PropEditor({ component, propName, propSchema, editor }) {
  console.log(component, component[propName]);
  const [value, setValue] = useState(component[propName]);

  let PropInput = editor.propTypeEditors.get(propSchema.type);

  if (!PropInput) {
    PropInput = UnknownPropTypeInput;
  }

  const onChange = useCallback(
    value => {
      component[propName] = value;
      setValue(value);
    },
    [component, setValue, propName]
  );

  return (
    <InputGroup name={propName}>
      <PropInput onChange={onChange} value={value} />
    </InputGroup>
  );
}

PropEditor.propTypes = {
  node: PropTypes.object,
  editor: PropTypes.object,
  component: PropTypes.object,
  propName: PropTypes.string,
  propSchema: PropTypes.object
};

function ComponentEditor({ node, editor, Component }) {
  const propEditors = [];

  const schema = Component.schema;

  for (const propName in schema) {
    if (!Object.prototype.hasOwnProperty.call(schema, propName)) continue;
    const propSchema = schema[propName];
    const component = node.entity.getComponent(Component);
    propEditors.push(
      <PropEditor
        key={propName}
        editor={editor}
        node={node}
        component={component}
        propName={propName}
        propSchema={propSchema}
      />
    );
  }

  return (
    <div>
      <PropertyGroup name={Component.name}>{propEditors}</PropertyGroup>
    </div>
  );
}

ComponentEditor.propTypes = {
  node: PropTypes.object,
  editor: PropTypes.object,
  Component: PropTypes.func
};

const getEditableComponents = (editor, node) =>
  node.entity.getComponentTypes().filter(Component => {
    const componentInfo = editor.registeredComponentsById[Component.name];
    return componentInfo && componentInfo.canEdit;
  });

export default function EntityEditor({ node, editor }) {
  const [components, setComponents] = useState([]);

  useEffect(() => {
    setComponents(getEditableComponents(editor, node));
  }, [setComponents, editor, node]);

  const onAddComponent = useCallback(() => {
    setComponents(getEditableComponents(editor, node));
  }, [setComponents, editor, node]);

  return (
    <div>
      <AddComponentInput editor={editor} node={node} onAdd={onAddComponent} />
      <div>
        {components.map(Component => (
          <ComponentEditor key={Component.name} node={node} editor={editor} Component={Component} />
        ))}
      </div>
    </div>
  );
}

EntityEditor.propTypes = {
  node: PropTypes.object,
  editor: PropTypes.object
};
