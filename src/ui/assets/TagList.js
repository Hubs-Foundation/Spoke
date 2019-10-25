import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { List } from "../layout/List";
import { Column, Row } from "../layout/Flex";
import { useSelectionHandler } from "./useSelection";
import { CaretRight } from "styled-icons/fa-solid/CaretRight";
import { CaretDown } from "styled-icons/fa-solid/CaretDown";

const StyledTagList = styled(Column)`
  height: auto;
  min-height: 100%;
  min-width: 120px;
  border-right: 1px solid ${props => props.theme.panel};
`;

const TagListHeader = styled(Row)`
  color: ${props => props.theme.text2};
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
  min-height: 24px;
  background-color: ${props => props.theme.panel2};
  border-bottom: 1px solid ${props => props.theme.panel};
`;

const TagListContainer = styled(List)`
  overflow-y: scroll;
`;

const TagListToggle = styled.div`
  padding: 2px 2px;
  margin: 0 2px;

  :hover {
    color: ${props => props.theme.text};
    background-color: ${props => props.theme.hover2};
    border-radius: 3px;
  }
`;

const TagContent = styled.div`
  display: flex;
  align-items: center;
  height: 24px;

  padding-left: ${props => props.depth * 20}px;

  color: ${props => props.theme.text};

  background-color: ${props => (props.selected ? props.theme.selected : "transparent")};

  :hover,
  :focus {
    background-color: ${props => (props.selected ? props.theme.blueHover : props.theme.hover)};
    color: ${props => props.theme.text};
  }

  :active {
    background-color: ${props => props.theme.bluePressed};
    color: ${props => props.theme.text};
  }
`;

export const TreeListItem = styled.li`
  display: flex;
  flex-direction: column;
  outline: none;
  overflow: hidden;
  user-select: none;
  min-height: 24px;

  background-color: ${props => props.theme.panel2};

  :nth-child(odd) {
    background-color: ${props => props.theme.panel};
  }
`;

const TreeLeafSpacer = styled.div`
  width: 16px;
`;

function TagListItem({ tag, depth, onClick, expanded, onToggleExpanded, selectedTags, ...rest }) {
  const onClickItem = useCallback(
    e => {
      e.stopPropagation();
      onClick(tag, e);
    },
    [onClick, tag]
  );

  const onClickToggle = useCallback(
    e => {
      e.stopPropagation();
      onToggleExpanded(tag);
    },
    [onToggleExpanded, tag]
  );

  const selected = selectedTags.indexOf(tag) !== -1 || (selectedTags.length === 0 && tag.value === "All");
  const isExpanded = expanded[tag.value];

  return (
    <TreeListItem selected={selected} {...rest}>
      <TagContent depth={depth} selected={selected} onClick={onClickItem}>
        {tag.children ? (
          <TagListToggle onClick={onClickToggle}>
            {isExpanded ? <CaretDown size={12} /> : <CaretRight size={12} />}
          </TagListToggle>
        ) : (
          <TreeLeafSpacer />
        )}
        {tag.label}
      </TagContent>
      {tag.children && isExpanded && (
        <List>
          {tag.children.map(child => (
            <TagListItem
              key={child.value}
              tag={child}
              onClick={onClick}
              depth={depth + 1}
              expanded={expanded}
              selectedTags={selectedTags}
              onToggleExpanded={onToggleExpanded}
              {...rest}
            />
          ))}
        </List>
      )}
    </TreeListItem>
  );
}

TagListItem.propTypes = {
  tag: PropTypes.object.isRequired,
  onClick: PropTypes.func,
  depth: PropTypes.number,
  expanded: PropTypes.object,
  onToggleExpanded: PropTypes.func,
  selectedTags: PropTypes.arrayOf(PropTypes.object)
};

TagListItem.defaultProps = {
  depth: 0
};

export default function TagList({ tags, selectedTags, onChange, multiselect }) {
  const [onSelect, clearSelection] = useSelectionHandler(tags, selectedTags, onChange, multiselect);
  const [expanded, setExpanded] = useState({});
  const onToggleExpanded = useCallback(
    tag => {
      setExpanded({
        ...expanded,
        [tag.value]: !expanded[tag.value]
      });
    },
    [expanded, setExpanded]
  );

  return (
    <StyledTagList>
      <TagListHeader>Tags</TagListHeader>
      <TagListContainer>
        <TagListItem
          key="All"
          onClick={clearSelection}
          onToggleExpanded={onToggleExpanded}
          expanded={expanded}
          selectedTags={selectedTags}
          tag={{ label: "All", value: "All" }}
        />
        {tags.map(tag => (
          <TagListItem
            key={tag.value}
            onClick={onSelect}
            onToggleExpanded={onToggleExpanded}
            expanded={expanded}
            selectedTags={selectedTags}
            tag={tag}
          />
        ))}
      </TagListContainer>
    </StyledTagList>
  );
}

TagList.propTypes = {
  selectedTags: PropTypes.arrayOf(PropTypes.object).isRequired,
  tags: PropTypes.arrayOf(PropTypes.object).isRequired,
  onChange: PropTypes.func.isRequired,
  multiselect: PropTypes.bool
};

TagList.defaultProps = {
  tags: [],
  selectedTags: [],
  onSelect: () => {}
};
