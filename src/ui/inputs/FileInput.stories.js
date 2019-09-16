import React from "react";
import { action } from "@storybook/addon-actions";
import FileInput from "./FileInput";

export default {
  title: "FileInput",
  component: FileInput
};

export const fileInput = () => <FileInput onChange={action("onChange")} />;
