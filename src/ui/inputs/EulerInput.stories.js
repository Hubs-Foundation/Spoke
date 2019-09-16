import React from "react";
import { action } from "@storybook/addon-actions";
import EulerInput from "./EulerInput";

export default {
  title: "EulerInput",
  component: EulerInput
};

export const eulerInput = () => <EulerInput onChange={action("onChange")} />;
