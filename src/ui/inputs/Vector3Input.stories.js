import React from "react";
import { action } from "@storybook/addon-actions";
import Vector3Input from "./Vector3Input";

export default {
  title: "Vector3Input",
  component: Vector3Input
};

export const vector3Input = () => <Vector3Input onChange={action("onChange")} />;
