import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

const StatsContainer = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  color: white;
  padding: 8px;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  width: 150px;

  h3 {
    font-size: 14px;
  }

  ul {
    margin: 8px 4px;
  }
`;

export default function Stats({ editor }) {
  const [info, setInfo] = useState(0);

  useEffect(() => {
    editor.renderer.onUpdateStats = info => {
      if (info.render.frame % 3 === 0) {
        setInfo({
          geometries: info.memory.geometries,
          textures: info.memory.textures,
          fps: info.render.fps,
          frameTime: info.render.frameTime,
          calls: info.render.calls,
          triangles: info.render.triangles,
          points: info.render.points,
          lines: info.render.lines
        });
      }
    };

    return () => {
      editor.renderer.onUpdateStats = undefined;
    };
  }, [editor]);

  return (
    <StatsContainer>
      <h3>Stats:</h3>
      {info && (
        <ul>
          <li>
            Memory:
            <ul>
              <li>Geometries: {info.geometries}</li>
              <li>Textures: {info.textures}</li>
            </ul>
          </li>
          <li>
            Render:
            <ul>
              <li>FPS: {Math.round(info.fps)}</li>
              <li>Frame Time: {Math.round(info.frameTime)}ms</li>
              <li>Calls: {info.calls}</li>
              <li>Triangles: {info.triangles}</li>
              <li>Points: {info.points}</li>
              <li>Lines: {info.lines}</li>
            </ul>
          </li>
        </ul>
      )}
    </StatsContainer>
  );
}

Stats.propTypes = {
  editor: PropTypes.object
};
