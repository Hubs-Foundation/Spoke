import React from "react";
import { action } from "@storybook/addon-actions";
import BooleanInput from "./BooleanInput";

export default {
  title: "BooleanInput",
  component: BooleanInput
};

export const booleanInput = () => <BooleanInput onChange={action("onChange")} />;

export const checked = () => <BooleanInput value={true} onChange={action("onChange")} />;

export const disabled = () => <BooleanInput disabled value={true} onChange={action("onChange")} />;
