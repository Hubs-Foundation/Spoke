import React, { Component } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { getLatestUpdate } from "./whats-new-utils";

const LatestUpdateContainer = styled.section`
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.1em;
`;

const Title = styled.span`
  font-weight: bold;
  padding-right: 0.5em;
`;

const Date = styled.span`
  color: ${props => props.theme.text2};
`;

const ViewMore = styled.div`
  text-align: right;
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
        <div>
          <Title>Latest Update:</Title>
          <Date>{this.state.latestUpdate.formattedMergedAt}</Date> - {this.state.latestUpdate.title}
          <ViewMore>
            <Link to="/whats-new">View more recent updates</Link>
          </ViewMore>
        </div>
      </LatestUpdateContainer>
    );
  }
}
