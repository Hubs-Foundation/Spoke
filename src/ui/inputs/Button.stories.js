import React from "react";
import { Button, MediumButton, LargeButton, SecondaryButton, MenuButton } from "./Button";

export default {
  title: "Button",
  component: Button
};

export const button = () => <Button>Default Button</Button>;

export const disabled = () => <Button disabled>Medium Button</Button>;

export const mediumButton = () => <MediumButton>Medium Button</MediumButton>;

export const largeButton = () => <LargeButton>Large Button</LargeButton>;

export const secondaryButton = () => <SecondaryButton>Secondary Button</SecondaryButton>;

export const menuButton = () => <MenuButton>Menu Button</MenuButton>;
