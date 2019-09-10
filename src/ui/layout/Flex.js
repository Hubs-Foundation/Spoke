import styled from "styled-components";

function getFlex(props) {
  if (props.flex == null) {
    return 0;
  } else if (typeof props.flex !== "number") {
    return 1;
  }

  return props.flex;
}

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  flex: ${getFlex};
`;

export const Row = styled.div`
  display: flex;
  flex: ${getFlex};
`;
