import React, { useCallback, useState, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { PieChart, Pie, Legend, Label, Cell } from "recharts";
import styled, { ThemeContext } from "styled-components";
import { PropertiesPanelButton } from "./Button";
import { validateString } from "@robertlong/gltf-validator";
import { EditorContext } from "../contexts/EditorContext";
import Collapsible from "./Collapsible";
import { bytesToSize } from "../utils";

const ChartContainer = styled.div`
  margin: 4px 0;
  padding: 4px;
  background-color: ${props => props.theme.panel2};
  border-radius: 4px;
`;

export function GLTFFileChart({ node }) {
  const stats = node.stats;

  let totalSize = stats.jsonSize;
  const payload = [{ name: "JSON", type: "application/json", size: stats.jsonSize }];

  for (const key in stats.bufferInfo) {
    if (!Object.prototype.hasOwnProperty.call(stats.bufferInfo, key)) continue;
    const item = stats.bufferInfo[key];
    totalSize += item.size || 0;
    payload.push(item);
  }

  for (const key in stats.textureInfo) {
    if (!Object.prototype.hasOwnProperty.call(stats.textureInfo, key)) continue;
    const item = stats.textureInfo[key];
    totalSize += item.size || 0;
    payload.push(item);
  }

  const legendFormatter = useCallback(
    (value, entry, _index) => {
      const name = entry.payload.name;
      const shortenedName = name.length > 15 ? entry.payload.name.substring(0, 12) + "..." : name;
      return (
        <span title={name}>{`${shortenedName}: ${bytesToSize(entry.payload.value)} (${Math.round(
          (entry.payload.value / totalSize) * 100
        )}%)`}</span>
      );
    },
    [totalSize]
  );

  let height = 240;

  if (payload.length > 15) {
    height += (payload.length - 15) * 16;
  }

  const theme = useContext(ThemeContext);
  const count = payload.length;

  const getColor = useCallback(
    itemIndex => {
      const colors = theme.chartColors;
      const index = Math.round((itemIndex / count) * colors.length);
      return colors[index];
    },
    [theme, count]
  );

  return (
    <ChartContainer>
      <PieChart width={400} height={height}>
        <Pie
          isAnimationActive={false}
          data={payload}
          dataKey="size"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
        >
          {payload.map((entry, index) => (
            <Cell key={index} fill={getColor(index)} stroke={theme.panel2} />
          ))}
          <Label fill={theme.text} value={`Total: ${bytesToSize(totalSize)}`} offset={0} position="center" />
        </Pie>
        <Legend layout="vertical" align="right" verticalAlign="middle" iconType="rect" formatter={legendFormatter} />
      </PieChart>
    </ChartContainer>
  );
}

GLTFFileChart.propTypes = {
  node: PropTypes.object
};

const Thumbnail = styled.img`
  width: 64px;
  height: 64px;
  border: 1px solid rgba(0, 0, 0, 0.5);
  border-radius: 4px;
`;

const ImageItemContainer = styled.li`
  display: flex;
  margin: 4px 0;
  padding: 4px;
  background-color: ${props => props.theme.panel2};
  border-radius: 4px;

  & > :first-child {
    margin-right: 8px;
  }

  h3 {
    font-size: 14px;
  }
`;

function GLTFTextureItem({ item }) {
  return (
    <ImageItemContainer>
      <Thumbnail src={item.url} alt={item.name} />
      <div>
        <h3>{item.name}</h3>
        <ul>
          <li>
            <b>Type:</b> {item.type}
          </li>
          <li>
            <b>Size:</b> {bytesToSize(item.size)}
          </li>
          <li>
            <b>Dimensions:</b> {`${item.width}px x ${item.height}px`}
          </li>
        </ul>
      </div>
    </ImageItemContainer>
  );
}

GLTFTextureItem.propTypes = {
  item: PropTypes.object
};

export function GLTFTextureList({ node }) {
  const items = Object.values(node.stats.textureInfo);

  return (
    <ul>
      {items.map((item, i) => (
        <GLTFTextureItem key={i} item={item} />
      ))}
    </ul>
  );
}

GLTFTextureList.propTypes = {
  node: PropTypes.object
};

const MeshItemContainer = styled.li`
  display: flex;
  flex-direction: column;
  margin: 4px 0;
  padding: 8px;
  background-color: ${props => props.theme.panel2};
  border-radius: 4px;

  h3 {
    font-size: 14px;
    margin-bottom: 4px;
  }
`;

function GLTFMeshItem({ item }) {
  return (
    <MeshItemContainer>
      <h3>{item.name}</h3>
      <ul>
        <li>
          <b>Triangles:</b> {item.triangles}
        </li>
        <li>
          <b>Vertices:</b> {item.vertices}
        </li>
      </ul>
    </MeshItemContainer>
  );
}

GLTFMeshItem.propTypes = {
  item: PropTypes.object
};

export function GLTFMeshList({ node }) {
  const items = Object.values(node.stats.meshInfo);

  return (
    <ul>
      {items.map((item, i) => (
        <GLTFMeshItem key={i} item={item} />
      ))}
    </ul>
  );
}

GLTFMeshList.propTypes = {
  node: PropTypes.object
};

const StatsContainer = styled.ul`
  margin: 4px 0;
  padding: 8px;
  background-color: ${props => props.theme.panel2};
  border-radius: 4px;
`;

export function GLTFStats({ node }) {
  const stats = node.stats;

  return (
    <StatsContainer>
      <li>
        <b>Nodes:</b> {stats.nodes}
      </li>
      <li>
        <b>Meshes:</b> {stats.meshes}
      </li>
      <li>
        <b>Materials:</b> {stats.materials}
      </li>
      <li>
        <b>Textures:</b> {stats.textures}
      </li>
      <li>
        <b>Triangles:</b> {stats.triangles}
      </li>
      <li>
        <b>Vertices:</b> {stats.vertices}
      </li>
    </StatsContainer>
  );
}

GLTFStats.propTypes = {
  node: PropTypes.object
};

const ValidationInfoContainer = styled.div`
  margin: 4px 0;
  padding: 8px;
  background-color: ${props => props.theme.panel2};
  border-radius: 4px;

  h3 {
    font-size: 14px;
  }
`;

const IssueItemContainer = styled.li`
  margin: 4px 0;
  padding: 8px;
  background-color: ${props => props.theme.panel2};
  border-radius: 4px;

  h3 {
    font-size: 14px;
  }
`;

function IssueItem({ issue }) {
  return (
    <IssueItemContainer>
      <h3>{issue.code}</h3>
      <p>{issue.message}</p>
      <p>
        On: <code>{issue.pointer}</code>
      </p>
    </IssueItemContainer>
  );
}

IssueItem.propTypes = {
  issue: PropTypes.object
};

const NoIssues = styled.div`
  width: 100%;
  text-align: center;
  color: ${props => props.theme.green};
  font-size: 14px;
  font-weight: bold;
  margin: 8px 0;
`;

function IssueList({ label, issues, severity }) {
  const filteredIssues = issues.filter(issue => issue.severity === severity);

  if (filteredIssues.length === 0) {
    return null;
  }

  return (
    <Collapsible label={`${label} (${filteredIssues.length})`}>
      <ul>
        {filteredIssues.map((issue, index) => (
          <IssueItem issue={issue} key={index} />
        ))}
      </ul>
    </Collapsible>
  );
}

IssueList.propTypes = {
  label: PropTypes.string,
  severity: PropTypes.number,
  issues: PropTypes.array
};

export function GLTFValidation({ node }) {
  const editor = useContext(EditorContext);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState();

  useEffect(() => {
    setValidating(false);
    setValidation();
  }, [node]);

  const onValidate = useCallback(() => {
    const validate = async () => {
      setValidating(true);

      try {
        const validation = await validateString(JSON.stringify(node.gltfJson));
        setValidation(validation);
      } catch (error) {
        console.log(error);
        editor.emit("error", error);
      } finally {
        setValidating(false);
      }
    };

    validate();
  }, [setValidating, setValidation, editor, node]);

  return (
    <>
      {validation && (
        <>
          <ValidationInfoContainer>
            <h3>Info:</h3>
            <ul>
              <li>
                <b>Version:</b> {validation.info.version}
              </li>
              <li>
                <b>Generator:</b> {validation.info.generator}
              </li>
              <li>
                <b>Draw Call Count:</b> {validation.info.drawCallCount}
              </li>
              <li>
                <b>Material Count:</b> {validation.info.materialCount}
              </li>
              <li>
                <b>Total Triangle Count:</b> {validation.info.totalTriangleCount}
              </li>
              <li>
                <b>Total Vertex Count:</b> {validation.info.totalVertexCount}
              </li>
              <li>
                <b>Animation Count:</b> {validation.info.animationCount}
              </li>
              <li>
                <b>Max Attributes:</b> {validation.info.maxAttributes}
              </li>
              <li>
                <b>Max Influences:</b> {validation.info.maxInfluences}
              </li>
              <li>
                <b>Max UVs:</b> {validation.info.maxUVs}
              </li>
              <li>
                <b>Has Default Scene:</b> {validation.info.hasDefaultScene.toString()}
              </li>
              <li>
                <b>Has Morph Targets:</b> {validation.info.hasMorphTargets.toString()}
              </li>
              <li>
                <b>Has Skins:</b> {validation.info.hasSkins.toString()}
              </li>
              <li>
                <b>Has Textures:</b> {validation.info.hasTextures.toString()}
              </li>
            </ul>
            {validation.issues.messages.length === 0 && <NoIssues>No issues detected.</NoIssues>}
          </ValidationInfoContainer>
          <IssueList label="Errors" severity={0} issues={validation.issues.messages} />
          <IssueList label="Warnings" severity={1} issues={validation.issues.messages} />
          <IssueList label="Info" severity={2} issues={validation.issues.messages} />
          <IssueList label="Hints" severity={3} issues={validation.issues.messages} />
        </>
      )}
      {!validation && (
        <PropertiesPanelButton disabled={validating} onClick={onValidate}>
          Validate glTF
        </PropertiesPanelButton>
      )}
    </>
  );
}

GLTFValidation.propTypes = {
  node: PropTypes.object
};

export function GLTFInfo({ node }) {
  return (
    <Collapsible label="glTF Info">
      <Collapsible open label="Stats">
        <GLTFStats node={node} />
      </Collapsible>
      <Collapsible open label="Files">
        <GLTFFileChart node={node} />
      </Collapsible>
      <Collapsible open label="Textures">
        <GLTFTextureList node={node} />
      </Collapsible>
      <Collapsible open label="Meshes">
        <GLTFMeshList node={node} />
      </Collapsible>
      <Collapsible open label="Validation">
        <GLTFValidation node={node} />
      </Collapsible>
    </Collapsible>
  );
}

GLTFInfo.propTypes = {
  node: PropTypes.object
};
