import React, { useCallback, useContext, useMemo } from "react";
import PropTypes from "prop-types";
import styled, { ThemeContext } from "styled-components";
import { ExclamationTriangle } from "styled-icons/fa-solid/ExclamationTriangle";
import Tooltip from "../layout/Tooltip";

const IssuesTooltipContainer = styled.div`
  display: inline-block;
  pointer-events: none;
  background-color: rgba(21, 23, 27, 0.9);
  border-radius: 3px;
  padding: 8px;
  max-width: 320px;
  overflow: hidden;
  overflow-wrap: break-word;
  user-select: none;

  h6 {
    font-size: 14px;
  }

  ul {
    margin-top: 4px;
  }

  li {
    margin-bottom: 4px;
    margin-left: 4px;
    font-family: "Lucida Console", Monaco, monospace;
    font-size: 12px;
  }
`;

const IssueIcon = styled(ExclamationTriangle)`
  color: ${props => props.color};
`;

export default function NodeIssuesIcon({ node }) {
  const theme = useContext(ThemeContext);

  const severityToColor = useMemo(
    () => ({
      warning: theme.yellow,
      error: theme.red
    }),
    [theme]
  );

  const renderInfo = useCallback(() => {
    return (
      <IssuesTooltipContainer>
        <h6>Issues:</h6>
        <ul>
          {node.issues.map((issue, i) => {
            return (
              <li key={i}>
                <IssueIcon size={12} color={severityToColor[issue.severity]} /> {issue.message}
              </li>
            );
          })}
        </ul>
      </IssuesTooltipContainer>
    );
  }, [node, severityToColor]);

  let maxSeverity = "warning";

  for (const issue of node.issues) {
    if (issue.severity === "error") {
      maxSeverity = "error";
      break;
    }
  }

  return (
    <Tooltip renderContent={renderInfo}>
      <IssueIcon size={14} color={severityToColor[maxSeverity]} />
    </Tooltip>
  );
}

NodeIssuesIcon.propTypes = {
  node: PropTypes.object.isRequired
};
