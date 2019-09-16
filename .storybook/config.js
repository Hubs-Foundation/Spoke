import React from "react";
import { configure, addDecorator, addParameters } from "@storybook/react";
import { themes } from "@storybook/theming";

addParameters({
  options: {
    theme: themes.dark
  }
});

import { ThemeProvider } from "styled-components";
import GlobalStyle from "../src/ui/GlobalStyle";
import theme from "../src/ui/theme";

addDecorator(story => (
  <ThemeProvider theme={theme}>
    <>
      <GlobalStyle />
      {story()}
    </>
  </ThemeProvider>
));

// automatically import all files ending in *.stories.js
configure([require.context("../src", true, /\.stories\.js$/)], module);
