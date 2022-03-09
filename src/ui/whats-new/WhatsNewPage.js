import React, { Component } from "react";
import InfiniteScroll from "react-infinite-scroller";
import styled from "styled-components";

import NavBar from "../navigation/NavBar";
import Loading from "../Loading";
import { getUpdates } from "./whats-new-utils";

const WhatsNewContainer = styled.main`
  display: flex;
  align-items: center;
`;

const width = 800;
const contentWidth = 650;
const margin = width - contentWidth;
const breakpoint = `(max-width: ${width}px)`;

const WhatsNewContent = styled.div`
  max-width: ${width}px;

  @media ${breakpoint} {
    width: 100%;
    padding: 0 1em;
  }
`;

const WhatsNewTitle = styled.h1`
  font-size: 36px;
  text-align: center;
  margin: 1em 0 1.5em 0;
`;

const Update = styled.article`
  margin-bottom: 1em;

  a {
    text-decoration: none;
  }
`;

const Header = styled.div`
  margin-bottom: 0.5em;
`;

const Date = styled.h2`
  display: inline-block;
  width: ${margin}px;
  padding-right: 1em;
  vertical-align: top;
  padding-top: 0.25em;

  ${props =>
    !props.blank &&
    `
    font-size: 1.2em;
    font-weight: bold;
    text-align: right;
    color: ${props.theme.text2};
    `}

  @media ${breakpoint} {
    display: block;
    text-align: left;
  }
`;

const Title = styled.h2`
  display: inline-block;
  font-size: 2em;
  width: ${contentWidth}px;
  @media ${breakpoint} {
    width: auto;
  }
`;

const Body = styled.p`
  margin-left: ${margin}px;
  font-size: 1.1em;
  padding: 2em;
  background-color: ${props => props.theme.panel};
  border-radius: 6px;

  p {
    margin-bottom: 1em;
  }

  @media ${breakpoint} {
    margin-left: 0;
  }
`;

export default class WhatsNewPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      updates: [],
      hasMore: true
    };

    this.updatesIterator = getUpdates(30);
  }

  onLoadMore = async () => {
    const { value: updates, done } = await this.updatesIterator.next();

    let nextUpdates;

    if (updates) {
      let currentDate;

      // Blank out duplicate dates
      for (const update of updates) {
        if (update.formattedMergedAt === currentDate) {
          update.formattedMergedAt = null;
        } else {
          currentDate = update.formattedMergedAt;
        }
      }

      nextUpdates = [...this.state.updates, ...updates];
    } else {
      nextUpdates = this.state.updates;
    }

    this.setState({ updates: nextUpdates, hasMore: !done });
  };

  render() {
    const loader = (
      <div key="loader">
        <Loading message="Loading Updates..." />
      </div>
    );
    return (
      <>
        <NavBar />
        <WhatsNewContainer>
          <WhatsNewContent>
            <WhatsNewTitle>What&apos;s New</WhatsNewTitle>
            <InfiniteScroll loadMore={this.onLoadMore} hasMore={this.state.hasMore} loader={loader}>
              {this.state.updates.map((update, i) => {
                return (
                  <Update key={i}>
                    <Header>
                      <Date blank={!update.formattedMergedAt}>{update.formattedMergedAt}</Date>
                      <Title>
                        <a href={update.url}>{update.title}</a>
                      </Title>
                    </Header>
                    {/*
                      Setting HTML generated directly by markdownit, which is safe by default:
                      https://github.com/markdown-it/markdown-it/blob/master/docs/security.md
                    */}
                    <Body dangerouslySetInnerHTML={{ __html: update.formattedBody }} />
                  </Update>
                );
              })}
            </InfiniteScroll>
          </WhatsNewContent>
        </WhatsNewContainer>
      </>
    );
  }
}
