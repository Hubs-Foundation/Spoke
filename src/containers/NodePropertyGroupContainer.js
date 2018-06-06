import React, { Component } from "react";
import PropertyGroup from "../components/PropertyGroup";
import InputGroup from "../components/InputGroup";
import Vector3Input from "../components/Vector3Input";

export default class NodePropertyGroupContainer extends Component {
  render() {
    return (
      <PropertyGroup name="Node">
        <InputGroup name="Position">
          <Vector3Input />
        </InputGroup>
        <InputGroup name="Rotation">
          <Vector3Input />
        </InputGroup>
        <InputGroup name="Scale">
          <Vector3Input />
        </InputGroup>
      </PropertyGroup>
    );
  }
}
