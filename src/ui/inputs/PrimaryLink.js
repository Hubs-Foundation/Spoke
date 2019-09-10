import { Link } from "react-router-dom";
import styled from "styled-components";

const PrimaryLink = styled(Link)`
  font-size: 1.2em;
  color: ${props => props.theme.blue};
  line-height: 3em;
  vertical-align: middle;
`;

export default PrimaryLink;
