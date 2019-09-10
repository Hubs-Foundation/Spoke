import React, { Component } from "react";
import PropTypes from "prop-types";
import { withEditor } from "../contexts/EditorContext";
import styled from "styled-components";
import LibraryContainer from "../library/LibraryContainer";
import Panel from "../layout/Panel";
import { WindowMaximize } from "styled-icons/fa-solid/WindowMaximize";

const LibraryToolbarContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: none;
`;

const Viewport = styled.canvas`
  width: 100%;
  height: 100%;
`;

const ControlsText = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  pointer-events: none;
  color: white;
  padding: 8px;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
`;

class ViewportPanelContainer extends Component {
  static propTypes = {
    editor: PropTypes.object,
    showDialog: PropTypes.func,
    hideDialog: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.canvasRef = React.createRef();

    this.state = {
      flyModeEnabled: false
    };
  }

  componentDidMount() {
    const editor = this.props.editor;
    editor.addListener("initialized", this.onEditorInitialized);
    editor.initializeRenderer(this.canvasRef.current);
  }

  componentWillUnmount() {
    const editor = this.props.editor;

    editor.removeListener("selectionChanged", this.onSelectionChanged);

    if (editor.spokeControls) {
      editor.spokeControls.removeListener("flyModeChanged", this.onFlyModeChanged);
    }

    if (editor.renderer) {
      editor.renderer.dispose();
    }
  }

  onEditorInitialized = () => {
    const editor = this.props.editor;
    editor.addListener("selectionChanged", this.onSelectionChanged);
    editor.spokeControls.addListener("flyModeChanged", this.onFlyModeChanged);
  };

  onFlyModeChanged = () => {
    this.setState({ flyModeEnabled: this.props.editor.flyControls.enabled });
  };

  onSelectionChanged = () => {
    this.setState({ objectSelected: this.props.editor.selected.length > 0 });
  };

  // id used in onboarding

  render() {
    return (
      <Panel id="viewport-panel" title="Viewport" icon={WindowMaximize}>
        <Viewport ref={this.canvasRef} tabIndex="-1" />
        <LibraryToolbarContainer>
          <LibraryContainer />
        </LibraryToolbarContainer>
        <ControlsText>
          {this.state.flyModeEnabled
            ? "[W][A][S][D] Move Camera | [Shift] Fly faster"
            : `[LMB] Orbit / Select | [MMB] Pan | [RMB] Fly ${this.state.objectSelected ? "| [F] Focus" : ""}`}
        </ControlsText>
      </Panel>
    );
  }
}

export default withEditor(ViewportPanelContainer);
