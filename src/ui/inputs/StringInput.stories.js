import React from "react";
import { action } from "@storybook/addon-actions";
import StringInput from "./StringInput";

export default {
  title: "StringInput",
  component: StringInput
};

export const stringInput = () => <StringInput onChange={action("onChange")} />;
