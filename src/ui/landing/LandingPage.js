import React, { Component } from "react";
import styled from "styled-components";
import spokeLogo from "../../assets/spoke-logo.png";
import landingVideoMp4 from "../../assets/video/SpokePromo.mp4";
import landingVideoWebm from "../../assets/video/SpokePromo.webm";
import NavBar from "../navigation/NavBar";
import Footer from "../navigation/Footer";
import Callout from "./Callout";
import { Link } from "react-router-dom";
import { LargeButton } from "../inputs/Button";
import benches from "../../assets/landing/benches.jpg";
import editor from "../../assets/landing/environment-editor.jpg";
import meeting from "../../assets/landing/meeting.jpg";

const Section = styled.section`
  padding: 100px 0;
`;

const HeroContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.8fr;
  grid-gap: 80px;
  max-width: 1200px;
  padding: 0 20px;
  justify-content: center;
  align-items: center;
  margin: 0 auto;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
    grid-gap: 20px;
  }
`;

const HeroLeft = styled.div`
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;

  h3 {
    font-weight: lighter;
    font-size: 2em;
    margin-bottom: 1.5em;
  }

  a {
    color: ${props => props.theme.text};
  }

  @media (max-width: 1200px) {
    font-size: 10px;
  }

  @media (max-width: 800px) {
    font-size: 8px;
  }
`;

const LogoContainer = styled.div`
  position: relative;
  margin-bottom: 5em;
  max-width: 385px;

  h2 {
    position: absolute;
    right: 6px;
    bottom: -8px;
    font-weight: bold;
    font-size: 3em;
  }
`;

const HeroRight = styled.div`
  video {
    border-radius: 8px;
    background-color: ${props => props.theme.panel};
  }
`;

const CalloutContainer = styled.div`
  display: grid;
  grid-gap: 80px;
  max-width: 1200px;
  padding: 0 20px;
  margin: 0 auto;
  grid-template-columns: repeat(3, 1fr);

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export default class LandingPage extends Component {
  render() {
    return (
      <>
        <NavBar />
        <main>
          <Section>
            <HeroContainer>
              <HeroLeft>
                <LogoContainer>
                  <img src={spokeLogo} alt="Spoke by Mozilla" />
                  <h2>make your space</h2>
                </LogoContainer>
                <h3>
                  Create 3D social scenes for{" "}
                  <a href="https://hubs.mozilla.com" rel="noopener noreferrer">
                    Hubs
                  </a>
                </h3>
                <LargeButton as={Link} to="/new">
                  Get Started
                </LargeButton>
              </HeroLeft>
              <HeroRight>
                <video playsInline loop autoPlay muted>
                  <source src={landingVideoMp4} type="video/mp4" />
                  <source src={landingVideoWebm} type="video/webm" />
                </video>
              </HeroRight>
            </HeroContainer>
          </Section>
          <Section>
            <CalloutContainer>
              <Callout imageSrc={benches}>
                <h3>Discover</h3>
                <p>
                  Explore images, videos, and 3D models from around the web, all without opening up a new tab. With
                  media integrations from Sketchfab, you&#39;ll be on your way to creating a scene in no time.
                </p>
              </Callout>
              <Callout imageSrc={editor}>
                <h3>Create</h3>
                <p>
                  No external software or 3D modeling experience required - build 3D scenes using the Spoke web editor
                  so you can have a space that&#39;s entirely custom to your needs. From a board room to outer space and
                  beyond, your space is in your control.
                </p>
              </Callout>
              <Callout imageSrc={meeting}>
                <h3>Share</h3>
                <p>
                  Invite people to meet in your new space by publishing your content to Hubs immediately. With just a
                  few clicks, you&#39;ll have a world of your own to experience and share - all from your browser.
                </p>
              </Callout>
            </CalloutContainer>
          </Section>
        </main>
        <Footer />
      </>
    );
  }
}
