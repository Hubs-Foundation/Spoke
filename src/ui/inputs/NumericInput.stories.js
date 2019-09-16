import React from "react";
import { action } from "@storybook/addon-actions";
import NumericInput from "./NumericInput";

export default {
  title: "NumericInput",
  component: NumericInput
};

export const numericInput = () => <NumericInput onChange={action("onChange")} />;
