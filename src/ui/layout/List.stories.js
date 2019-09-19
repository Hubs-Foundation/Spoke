import React from "react";
import { VerticalScrollContainer } from "./Flex";
import { List, ListItem, IconListItem } from "./List";
import { Plus } from "styled-icons/fa-solid/Plus";

export default {
  title: "List",
  component: List
};

export const list = () => (
  <VerticalScrollContainer height={320}>
    <List>
      {new Array(25).fill(0).map((_, index) => (
        <ListItem key={index} selected={index === 3} tabIndex={index}>{`Item ${index}`}</ListItem>
      ))}
    </List>
  </VerticalScrollContainer>
);

export const iconListItem = () => (
  <VerticalScrollContainer height={320}>
    <List>
      {new Array(25).fill(0).map((_, index) => (
        <IconListItem
          key={index}
          selected={index === 3}
          tabIndex={index}
          iconComponent={Plus}
        >{`Icon Item ${index}`}</IconListItem>
      ))}
    </List>
  </VerticalScrollContainer>
);
