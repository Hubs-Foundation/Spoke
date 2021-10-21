import styled from "styled-components";

export const PropertyLabel = styled.label`
  ${props =>
    (props.modified &&
      `font-weight: normal;
       color: ${props.theme.text2};`) ||
    `font-weight: bold;
      color: ${props.theme.text}
    `}
`;
