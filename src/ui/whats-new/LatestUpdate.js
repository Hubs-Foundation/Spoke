import React, { Component } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { getLatestUpdate } from "./whats-new-utils";

const LatestUpdateContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
`;

const StyledLatestUpdate = styled.div`
  min-height: 24px;
  margin: 1em 0;
  display: flex;
  justify-content: center;
  font-size: 1.1em;
  padding: 1em;
  border-radius: 6px;
  background-color: ${props => props.theme.panel};
`;

const Title = styled.span`
  font-weight: bold;
  padding-right: 0.5em;
`;

const Date = styled.span`
  margin-right: 8px;
  color: ${props => props.theme.text2};
`;

const ViewMore = styled.div`
  text-align: right;
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
    if (!this.state.latestUpdate) {
      return <LatestUpdateContainer></LatestUpdateContainer>;
    }
    return (
      <LatestUpdateContainer>
        <StyledLatestUpdate>
          <Title>Latest Update:</Title>
          <Date>{this.state.latestUpdate.formattedMergedAt}</Date>
          {this.state.latestUpdate.title}
          <ViewMore>
            <Link to="/whats-new">View More</Link>
          </ViewMore>
        </StyledLatestUpdate>
      </LatestUpdateContainer>
    );
  }
}
