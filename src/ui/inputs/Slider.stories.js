import React from "react";
import { action } from "@storybook/addon-actions";
import Slider from "./Slider";

export default {
  title: "Slider",
  component: Slider
};

export const slider = () => <Slider onChange={action("onChange")} />;
