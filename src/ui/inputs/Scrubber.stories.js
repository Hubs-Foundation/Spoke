import React from "react";
import { action } from "@storybook/addon-actions";
import Scrubber from "./Scrubber";

export default {
  title: "Scrubber",
  component: Scrubber
};

export const scrubber = () => <Scrubber onChange={action("onChange")}>Scrubber Label</Scrubber>;
