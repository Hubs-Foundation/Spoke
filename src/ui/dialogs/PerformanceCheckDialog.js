import React, { useContext } from "react";
import PropTypes from "prop-types";
import styled, { ThemeContext } from "styled-components";
import Dialog from "./Dialog";
import { bytesToSize } from "../utils";

const ColoredText = styled.span`
  color: ${props => props.color};
`;

const PerformanceItemContainer = styled.li`
  display: flex;
  min-height: 100px;
  background-color: ${props => props.theme.toolbar};
  border: 1px solid ${props => props.theme.panel};
  border-radius: 4px;
  margin: 4px;
  color: white;
  max-width: 560px;

  & > :first-child {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100px;
  }

  & > :last-child {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 12px;
    border-left: 1px solid ${props => props.theme.panel2};
  }

  h5 {
    font-size: 20px;
  }

  h6 {
    font-size: 16px;
  }

  a {
    white-space: nowrap;
    color: ${props => props.theme.blue};
  }

  p {
    margin: 0;
  }
`;

function PerformanceCheckItem({ score, scoreColor, title, description, learnMoreUrl, children }) {
  return (
    <PerformanceItemContainer>
      <div>
        <ColoredText as="h5" color={scoreColor}>
          {score}
        </ColoredText>
      </div>
      <div>
        <h6>
          {title}: {children}
        </h6>
        <p>
          {description}{" "}
          <a rel="noopener noreferrer" target="_blank" href={learnMoreUrl}>
            Learn More
          </a>
        </p>
      </div>
    </PerformanceItemContainer>
  );
}

PerformanceCheckItem.propTypes = {
  score: PropTypes.string.isRequired,
  scoreColor: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  description: PropTypes.string.isRequired,
  learnMoreUrl: PropTypes.string.isRequired
};

const scoreToValue = {
  Low: 0,
  Medium: 1,
  High: 2
};

export default function PerformanceCheckDialog({ scores, ...rest }) {
  const theme = useContext(ThemeContext);

  const scoreToColor = {
    Low: theme.green,
    Medium: theme.yellow,
    High: theme.red
  };

  const texturesScore =
    scoreToValue[scores.textures.largeTexturesScore] > scoreToValue[scores.textures.score]
      ? scores.textures.largeTexturesScore
      : scores.textures.score;

  return (
    <Dialog {...rest}>
      <ul>
        <PerformanceCheckItem
          title="Polygon Count"
          description="We recommend your scene use no more than 50,000 triangles for mobile devices."
          learnMoreUrl="https://hubs.mozilla.com/docs/spoke-optimization.html"
          score={scores.polygons.score}
          scoreColor={scoreToColor[scores.polygons.score]}
        >
          <ColoredText color={scoreToColor[scores.polygons.score]}>
            {scores.polygons.value.toLocaleString()} Triangles
          </ColoredText>
        </PerformanceCheckItem>
        <PerformanceCheckItem
          title="Materials"
          description="We recommend using no more than 25 unique materials in your scene to reduce draw calls on mobile devices."
          learnMoreUrl="https://hubs.mozilla.com/docs/spoke-optimization.html"
          score={scores.materials.score}
          scoreColor={scoreToColor[scores.materials.score]}
        >
          <ColoredText color={scoreToColor[scores.materials.score]}>
            {scores.materials.value} Unique Materials
          </ColoredText>
        </PerformanceCheckItem>
        <PerformanceCheckItem
          title="Textures"
          description="We recommend your textures use no more than 256MB of video RAM for mobile devices. We also recommend against using textures larger than 2048 x 2048."
          learnMoreUrl="https://hubs.mozilla.com/docs/spoke-optimization.html"
          score={texturesScore}
          scoreColor={scoreToColor[texturesScore]}
        >
          <ColoredText color={scoreToColor[scores.textures.score]}>
            ~{bytesToSize(scores.textures.value)} Video RAM
          </ColoredText>
          ,{" "}
          <ColoredText color={scoreToColor[scores.textures.largeTexturesScore]}>
            {scores.textures.largeTexturesValue} Large Textures
          </ColoredText>
        </PerformanceCheckItem>
        <PerformanceCheckItem
          title="Lights"
          description="While dynamic lights are not enabled on mobile devices, we recommend using no more than 3 lights in your scene (excluding ambient and hemisphere lights) for your scene to run on low end PCs."
          learnMoreUrl="https://hubs.mozilla.com/docs/spoke-optimization.html"
          score={scores.lights.score}
          scoreColor={scoreToColor[scores.lights.score]}
        >
          <ColoredText color={scoreToColor[scores.lights.score]}>{scores.lights.value} Lights</ColoredText>
        </PerformanceCheckItem>
        <PerformanceCheckItem
          title="File Size"
          description="We recommend a final file size of no more than 16MB for low bandwidth connections. Reducing the file size will reduce the time it takes to download your scene."
          learnMoreUrl="https://hubs.mozilla.com/docs/spoke-optimization.html"
          score={scores.fileSize.score}
          scoreColor={scoreToColor[scores.fileSize.score]}
        >
          <ColoredText color={scoreToColor[scores.fileSize.score]}>{bytesToSize(scores.fileSize.value)}</ColoredText>
        </PerformanceCheckItem>
      </ul>
    </Dialog>
  );
}

PerformanceCheckDialog.propTypes = {
  scores: PropTypes.object.isRequired,
  tag: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  confirmLabel: PropTypes.string.isRequired
};

PerformanceCheckDialog.defaultProps = {
  tag: "div",
  title: "Performance Check",
  confirmLabel: "Publish Scene"
};
