import React, { useContext, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { Column, Row } from "../layout/Flex";
import { List, ListItem } from "../layout/List";
import { EditorContext } from "../contexts/EditorContext";
import AssetDropZone from "./AssetDropZone";

const AssetsPanelContainer = styled(Row)`
  position: relative;
  flex: 1;
  background-color: ${props => props.theme.panel};
`;

const AssetsPanelToolbarContainer = styled.div`
  display: flex;
  min-height: 32px;
  background-color: ${props => props.theme.toolbar};
  align-items: center;
  padding: 0 8px;
  justify-content: space-between;
  border-bottom: 1px solid ${props => props.theme.panel};
`;

export const AssetPanelToolbarContent = styled(Row)`
  flex: 1;
  align-items: flex-end;

  & > * {
    margin-left: 16px;
  }
`;

export function AssetsPanelToolbar({ title, children, ...rest }) {
  return (
    <AssetsPanelToolbarContainer {...rest}>
      <div>{title}</div>
      <AssetPanelToolbarContent>{children}</AssetPanelToolbarContent>
    </AssetsPanelToolbarContainer>
  );
}

AssetsPanelToolbar.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node
};

const AssetsPanelColumn = styled(Column)`
  max-width: 175px;
  border-right: 1px solid ${props => props.theme.border};
`;

export const AssetPanelContentContainer = styled(Row)`
  flex: 1;
  overflow: hidden;
`;

function getSources(editor) {
  const isAuthenticated = editor.api.isAuthenticated();
  return editor.sources.filter(source => !source.requiresAuthentication || isAuthenticated);
}

export default function AssetsPanel() {
  const editor = useContext(EditorContext);

  const [sources, setSources] = useState(
    getSources(editor).filter(source => !source.experimental || editor.settings.enableExperimentalFeatures)
  );
  const [selectedSource, setSelectedSource] = useState(sources.length > 0 ? sources[0] : null);
  const SourceComponent = selectedSource && selectedSource.component;

  useEffect(() => {
    const onSetSource = sourceId => {
      setSelectedSource(sources.find(s => s.id === sourceId));
    };

    const onAuthChanged = () => {
      const nextSources = getSources(editor);
      setSources(nextSources);

      if (nextSources.indexOf(selectedSource) === -1) {
        setSelectedSource(nextSources.length > 0 ? nextSources[0] : null);
      }
    };

    const onSettingsChanged = () => {
      const enableExperimentalFeatures = editor.settings.enableExperimentalFeatures;
      const nextSources = getSources(editor).filter(source => !source.experimental || enableExperimentalFeatures);
      setSources(nextSources);
    };

    editor.addListener("settingsChanged", onSettingsChanged);
    editor.addListener("setSource", onSetSource);
    editor.api.addListener("authentication-changed", onAuthChanged);

    return () => {
      editor.removeListener("setSource", onSetSource);
      editor.api.removeListener("authentication-changed", onAuthChanged);
    };
  }, [editor, setSelectedSource, sources, setSources, selectedSource]);

  const [savedSourceState, setSavedSourceState] = useState({});

  const setSavedState = useCallback(
    state => {
      setSavedSourceState({
        ...savedSourceState,
        [selectedSource.id]: state
      });
    },
    [selectedSource, setSavedSourceState, savedSourceState]
  );

  const savedState = savedSourceState[selectedSource.id] || {};

  return (
    <AssetsPanelContainer id="assets-panel">
      <AssetsPanelColumn flex>
        <AssetsPanelToolbar title="Assets" />
        <List>
          {sources.map(source => (
            <ListItem key={source.id} onClick={() => setSelectedSource(source)} selected={selectedSource === source}>
              {source.name}
            </ListItem>
          ))}
        </List>
      </AssetsPanelColumn>
      <Column flex>
        {SourceComponent && (
          <SourceComponent
            key={selectedSource.id}
            source={selectedSource}
            editor={editor}
            savedState={savedState}
            setSavedState={setSavedState}
          />
        )}
      </Column>
      <AssetDropZone />
    </AssetsPanelContainer>
  );
}
