import React, { useCallback } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { List, ListItem } from "../layout/List";
import { Column, Row } from "../layout/Flex";
import { useSelectionHandler } from "./useSelection";
import { Times } from "styled-icons/fa-solid/Times";

function TagListItem({ tag, onClick, ...rest }) {
  const onClickItem = useCallback(e => onClick(tag, e), [tag, onClick]);

  return (
    <ListItem onClick={onClickItem} {...rest}>
      {tag.label}
    </ListItem>
  );
}

TagListItem.propTypes = {
  tag: PropTypes.object.isRequired,
  onClick: PropTypes.func
};

const StyledTagList = styled(Column)`
  height: auto;
  min-height: 100%;
  min-width: 100px;
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

const ClearTagsButton = styled(Times)`
  width: 16px;
  height: 16px;
  color: ${props => props.theme.text2};
  padding: 2px;
  border-radius: 3px;

  :hover {
    color: ${props => props.theme.text};
    background-color: ${props => props.theme.hover};
  }
`;

const TagListContainer = styled(List)`
  overflow-y: scroll;
`;

export default function TagList({ tags, selectedTags, onChange, multiselect }) {
  const [onSelect, clearSelection] = useSelectionHandler(tags, selectedTags, onChange, multiselect);

  return (
    <StyledTagList>
      <TagListHeader>
        Tags
        <ClearTagsButton onClick={clearSelection} />
      </TagListHeader>
      <TagListContainer>
        {tags.map(tag => (
          <TagListItem key={tag.value} onClick={onSelect} selected={selectedTags.indexOf(tag) !== -1} tag={tag} />
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
