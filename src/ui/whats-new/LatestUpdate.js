import React, { Component } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { getLatestUpdate } from "./whats-new-utils";

const LatestUpdateContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledLatestUpdate = styled.div`
  min-height: 24px;
  margin: 1em 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.1em;
  padding: 1em;
  border-radius: 6px;
  background-color: ${props => props.theme.panel};
`;

const Title = styled.span`
  text-align: center;
  font-weight: bold;
  padding-right: 0.5em;
`;

const Content = styled.span`
  max-width: 50vw;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const Date = styled.span`
  white-space: nowrap;
  margin-right: 8px;
  color: ${props => props.theme.text2};
`;

const ViewMore = styled.div`
  text-align: center;
  margin-left: 1em;
  a {
    color: ${props => props.theme.blue};
  }
`;

export default class LatestUpdate extends Component {
  state = {
    latestUpdate: null
  };

  componentDidMount() {
    getLatestUpdate().then(update => this.setState({ latestUpdate: update }));
  }

  render() {
    const latestUpdate = this.state.latestUpdate;

    if (!latestUpdate) {
      return <LatestUpdateContainer></LatestUpdateContainer>;
    }

    return (
      <LatestUpdateContainer>
        <StyledLatestUpdate>
          <Title>Latest Update:</Title>
          <Date>{latestUpdate.formattedMergedAt}</Date>
          <Content>{latestUpdate.title}</Content>
          <ViewMore>
            <Link to="/whats-new">View More</Link>
          </ViewMore>
        </StyledLatestUpdate>
      </LatestUpdateContainer>
    );
  }
}
