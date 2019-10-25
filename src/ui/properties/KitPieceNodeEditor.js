import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import SelectInput from "../inputs/SelectInput";
import BooleanInput from "../inputs/BooleanInput";
import { PuzzlePiece } from "styled-icons/fa-solid/PuzzlePiece";
import styled from "styled-components";

const SubPiecesHeader = styled.div`
  color: ${props => props.theme.text2};
  margin-left: 8px;
`;

const SubPiecesContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const SubPieceItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme.panel2};
  border-radius: 4px;
  margin: 8px;
`;

const SubPieceItemTitle = styled.div`
  display: flex;
  color: ${props => props.theme.text2};
  align-items: center;
  background-color: ${props => props.theme.toolbar};
  padding: 8px;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
`;

const MaterialSlotList = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 12px;
  padding: 8px;
`;

const MaterialSlotItemContainer = styled.div`
  display: flex;
  padding: 4px 0;
`;

const MaterialSlotItemTitle = styled.div`
  display: flex;
  color: ${props => props.theme.text2};
  align-items: center;
`;

const MaterialSlotContent = styled.div`
  display: flex;
  padding: 0 8px;
  flex: 1;
`;

function SubPieceItem({ name, children, ...rest }) {
  return (
    <SubPieceItemContainer {...rest}>
      <SubPieceItemTitle>{name}</SubPieceItemTitle>
      <MaterialSlotList>{children}</MaterialSlotList>
    </SubPieceItemContainer>
  );
}

SubPieceItem.propTypes = {
  name: PropTypes.string,
  children: PropTypes.node
};

function MaterialSlotItem({ name, children, ...rest }) {
  return (
    <MaterialSlotItemContainer {...rest}>
      <MaterialSlotItemTitle>{name} Material</MaterialSlotItemTitle>
      <MaterialSlotContent>{children}</MaterialSlotContent>
    </MaterialSlotItemContainer>
  );
}

MaterialSlotItem.propTypes = {
  name: PropTypes.string,
  children: PropTypes.node
};

export default class KitPieceNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = PuzzlePiece;

  static description = "";

  onChangeMaterialSlot = (subPiece, materialSlot, materialId) => {
    this.props.editor.loadMaterialSlot(this.props.node, subPiece.id, materialSlot.id, materialId);
  };

  onChangeAnimation = activeClipIndex => {
    this.props.editor.setProperty(this.props.node, "activeClipIndex", activeClipIndex);
  };

  onChangeCollidable = collidable => {
    this.props.editor.setProperty(this.props.node, "collidable", collidable);
  };

  onChangeWalkable = walkable => {
    this.props.editor.setProperty(this.props.node, "walkable", walkable);
  };

  onChangeCastShadow = castShadow => {
    this.props.editor.setProperty(this.props.node, "castShadow", castShadow);
  };

  onChangeReceiveShadow = receiveShadow => {
    this.props.editor.setProperty(this.props.node, "receiveShadow", receiveShadow);
  };

  render() {
    const { node } = this.props;

    return (
      <NodeEditor {...this.props} description={KitPieceNodeEditor.description}>
        <SubPiecesHeader>Sub Pieces:</SubPiecesHeader>
        <SubPiecesContainer>
          {node.subPieces.map(subPiece => (
            <SubPieceItem key={"subPiece-" + subPiece.id} name={subPiece.name}>
              {subPiece.materialSlots.map(materialSlot => (
                <MaterialSlotItem key={"materialSlot-" + materialSlot.id} name={materialSlot.name}>
                  <SelectInput
                    options={materialSlot.options.map(o => ({ value: o.id, label: o.name }))}
                    value={materialSlot.value ? materialSlot.value.id : null}
                    onChange={(value, option) => this.onChangeMaterialSlot(subPiece, materialSlot, value, option)}
                  />
                </MaterialSlotItem>
              ))}
            </SubPieceItem>
          ))}
        </SubPiecesContainer>
        <InputGroup name="Loop Animation">
          <SelectInput options={node.getClipOptions()} value={node.activeClipIndex} onChange={this.onChangeAnimation} />
        </InputGroup>
        <InputGroup name="Collidable">
          <BooleanInput value={node.collidable} onChange={this.onChangeCollidable} />
        </InputGroup>
        <InputGroup name="Walkable">
          <BooleanInput value={node.walkable} onChange={this.onChangeWalkable} />
        </InputGroup>
        <InputGroup name="Cast Shadow">
          <BooleanInput value={node.castShadow} onChange={this.onChangeCastShadow} />
        </InputGroup>
        <InputGroup name="Receive Shadow">
          <BooleanInput value={node.receiveShadow} onChange={this.onChangeReceiveShadow} />
        </InputGroup>
      </NodeEditor>
    );
  }
}
