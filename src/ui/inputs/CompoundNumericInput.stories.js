import React from "react";
import { action } from "@storybook/addon-actions";
import CompoundNumericInput from "./CompoundNumericInput";

export default {
  title: "CompoundNumericInput",
  component: CompoundNumericInput
};

export const compoundNumericInput = () => <CompoundNumericInput onChange={action("onChange")} />;
