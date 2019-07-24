import { css } from "styled-components";

export default css`
  background-color: ${props => props.theme.inputBackground};
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
  height: 24px;
  padding: 6px 8px;

  &:hover {
    border-color: ${props => props.theme.blueHover};
  }

  &:focus {
    border-color: ${props => props.theme.blue};
  }

  &:disabled {
    background-color: ${props => props.theme.disabled};
    color: ${props => props.theme.disabledText};
  }
`;
