import React, { Component } from "react";
import configs from "../../configs";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { withAuth } from "../contexts/AuthContext";
import styled from "styled-components";

const StyledNavBar = styled.header`
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 20px;
  font-size: 1.4em;

  a {
    color: ${props => props.theme.text};
    text-decoration: none;
  }
`;

const IconContainer = styled.div`
  margin-right: 20px;

  a {
    display: block;
  }

  img {
    width: 48px;
    display: block;
  }
`;

const MiddleContainer = styled.div`
  display: flex;
  flex: 1;

  @media (max-width: 600px) {
    display: none;
  }
`;

const NavList = styled.ul`
  display: flex;

  li {
    padding: 0 20px;
  }
`;

const RightContainer = styled.div`
  display: flex;
  justify-content: flex-end;

  @media (max-width: 600px) {
    flex: 1;
  }
`;

class NavBar extends Component {
  static propTypes = {
    isAuthenticated: PropTypes.bool.isRequired
  };

  render() {
    return (
      <StyledNavBar>
        <IconContainer>
          <Link to="/">
            <img src={configs.icon()} alt={configs.name()} />
          </Link>
        </IconContainer>
        <MiddleContainer>
          <nav>
            <NavList>
              <li>
                <Link to="/whats-new">What&apos;s New</Link>
              </li>
              <li>
                <a href="https://github.com/mozilla/Spoke" rel="noopener noreferrer">
                  Source
                </a>
              </li>
              {configs.isMoz() && (
                <li>
                  <a href="https://discord.gg/wHmY4nd" rel="noopener noreferrer">
                    Community
                  </a>
                </li>
              )}
              {configs.isMoz() && (
                <li>
                  <a href="https://hubs.mozilla.com" rel="noopener noreferrer">
                    Hubs
                  </a>
                </li>
              )}
            </NavList>
          </nav>
        </MiddleContainer>
        <RightContainer>
          <NavList>
            {this.props.isAuthenticated ? (
              <>
                <li>
                  <Link to="/projects">Projects</Link>
                </li>
                <li>
                  <Link to="/logout">Logout</Link>
                </li>
              </>
            ) : (
              <li>
                <Link to="/login">Login</Link>
              </li>
            )}
          </NavList>
        </RightContainer>
      </StyledNavBar>
    );
  }
}

export default withAuth(NavBar);
