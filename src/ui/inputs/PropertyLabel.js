import styled from "styled-components";

export const PropertyLabel = styled.label`
  ${props =>
    (props.modified &&
      `
    font-weight: normal;
  `) ||
    `font-weight: bold;`}
`;
