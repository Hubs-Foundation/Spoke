import React, { Component } from "react";
import mozillaLogo from "../../assets/mozilla-logo.png";
import styled from "styled-components";

const StyledFooter = styled.footer`
  display: flex;
  margin: 24px 0;
  font-size: 1.4em;

  a {
    text-decoration: none;
    display: flex;
  }

  nav {
    width: 100%;
  }

  @media (min-width: 600px) {
    justify-content: flex-end;

    nav {
      width: auto;
    }
  }
`;

const NavList = styled.ul`
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: flex-end;

  @media (min-width: 600px) {
    flex-direction: row;
    align-items: flex-end;
  }
`;

const NavListItem = styled.li`
  display: flex;
  align-items: flex-end;
  padding: 0 20px;
  margin: 8px 0;

  img {
    width: 172px;
    height: 49px;
    vertical-align: baseline;
  }

  @media (min-width: 600px) {
    margin: 0;
    display: ${props => (props.mobileOnly ? "none" : "flex")};
  }
`;

export default class Footer extends Component {
  render() {
    return (
      <StyledFooter>
        <nav>
          <NavList>
            <NavListItem mobileOnly>
              <a href="https://github.com/mozilla/Spoke" rel="noopener noreferrer">
                Source
              </a>
            </NavListItem>
            <NavListItem mobileOnly>
              <a href="https://discord.gg/wHmY4nd" rel="noopener noreferrer">
                Community
              </a>
            </NavListItem>
            <NavListItem mobileOnly>
              <a href="https://hubs.mozilla.com" rel="noopener noreferrer">
                Hubs
              </a>
            </NavListItem>
            <NavListItem>
              <a href="https://github.com/mozilla/hubs/blob/master/TERMS.md" rel="noopener noreferrer">
                Terms of Use
              </a>
            </NavListItem>
            <NavListItem>
              <a href="https://github.com/mozilla/hubs/blob/master/PRIVACY.md" rel="noopener noreferrer">
                Privacy Notice
              </a>
            </NavListItem>
            <NavListItem>
              <a href="https://mozilla.com" rel="noopener noreferrer">
                <img alt="Mozilla" src={mozillaLogo} />
              </a>
            </NavListItem>
          </NavList>
        </nav>
      </StyledFooter>
    );
  }
}
