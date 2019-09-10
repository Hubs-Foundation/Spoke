import React from "react";
import PropTypes from "prop-types";
import NumericInputGroup from "../inputs/NumericInputGroup";
import styled from "styled-components";
import { AngleUp } from "styled-icons/fa-solid/AngleUp";
import { AngleDown } from "styled-icons/fa-solid/AngleDown";

const SnappingDropdownContainer = styled.div`
  height: 16px;
  position: relative;
  z-index: 10;
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  height: 16px;
  width: 68px;
  cursor: pointer;

  &:hover {
    color: ${props => props.theme.blueHover};
  }
`;

const HeaderTitle = styled.div`
  margin: 0px 1px;

  & + svg {
    text-align: center;
    width: 12px;
    height: 12px;
    margin: 2px 4px;
  }
`;

const List = styled.ul`
  padding: 8px 0px;
  background-color: ${props => props.theme.background};
  border-radius: 4px;
  list-style-type: none;
  width: 180px;
  position: absolute;
  top: 20px;
  box-shadow: ${props => props.theme.shadow30};
`;

const ListItem = styled.li`
  display: flex;
  margin: 0 4px 8px 4px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export default class SnappingDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listOpen: false
    };
  }

  handleClickOutside() {
    this.setState({
      listOpen: false
    });
  }

  toggleList() {
    this.setState(prevState => ({
      listOpen: !prevState.listOpen
    }));
  }

  render() {
    return (
      <SnappingDropdownContainer>
        <Header onClick={() => this.toggleList()}>
          <HeaderTitle>Snapping</HeaderTitle>
          {this.state.listOpen ? <AngleUp size={12} /> : <AngleDown size={12} />}
        </Header>
        {this.state.listOpen && (
          <List>
            <ListItem>
              <NumericInputGroup
                name="Move"
                smallStep={0.01}
                mediumStep={0.1}
                largeStep={1}
                value={this.props.translationSnap}
                onChange={this.props.onChangeTranslationSnap}
                unit="m"
              />
            </ListItem>
            <ListItem>
              <NumericInputGroup
                name="Rotate"
                smallStep={1}
                mediumStep={15}
                largeStep={45}
                value={this.props.rotationSnap}
                onChange={this.props.onChangeRotationSnap}
                unit="°"
              />
            </ListItem>
            <ListItem>
              <NumericInputGroup
                name="Scale"
                smallStep={1}
                mediumStep={15}
                largeStep={45}
                value={this.props.scaleSnap}
                onChange={this.props.onChangeScaleSnap}
              />
            </ListItem>
          </List>
        )}
      </SnappingDropdownContainer>
    );
  }
}

SnappingDropdown.propTypes = {
  translationSnap: PropTypes.number,
  rotationSnap: PropTypes.number,
  scaleSnap: PropTypes.number,
  onChangeTranslationSnap: PropTypes.func,
  onChangeRotationSnap: PropTypes.func,
  onChangeScaleSnap: PropTypes.func
};
