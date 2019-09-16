import React from "react";
import { action } from "@storybook/addon-actions";
import ColorInput from "./ColorInput";

export default {
  title: "ColorInput",
  component: ColorInput
};

export const colorInput = () => <ColorInput onChange={action("onChange")} />;
