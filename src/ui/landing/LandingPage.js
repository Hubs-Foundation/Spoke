import React, { Component } from "react";
import styles from "./LandingPage.scss";
import spokeLogo from "../../assets/spoke-logo.png";
import landingVideoMp4 from "../../assets/video/SpokePromo.mp4";
import landingVideoWebm from "../../assets/video/SpokePromo.webm";
import NavBar from "../navigation/NavBar";
import Footer from "../navigation/Footer";
import Callout from "./Callout";
import Button from "../inputs/Button";
import benches from "../../assets/landing/benches.jpg";
import editor from "../../assets/landing/environment-editor.jpg";
import meeting from "../../assets/landing/meeting.jpg";

export default class LandingPage extends Component {
  render() {
    return (
      <>
        <NavBar />
        <main className={styles.landingPage}>
          <section>
            <div className={styles.heroContainer}>
              <div className={styles.heroLeft}>
                <div className={styles.logoContainer}>
                  <img src={spokeLogo} alt="Spoke by Mozilla" />
                  <h2>make your space</h2>
                </div>
                <h3>
                  Create 3D social scenes for{" "}
                  <a href="https://hubs.mozilla.com" rel="noopener noreferrer">
                    Hubs
                  </a>
                </h3>
                <Button large to="/new">
                  Get Started
                </Button>
              </div>
              <div className={styles.heroRight}>
                <video playsInline loop autoPlay muted>
                  <source src={landingVideoMp4} type="video/mp4" />
                  <source src={landingVideoWebm} type="video/webm" />
                </video>
              </div>
            </div>
          </section>
          <section>
            <div className={styles.calloutContainer}>
              <Callout imageSrc={benches}>
                <h3>Discover</h3>
                <p>
                  Explore images, videos, and 3D models from around the web, all without opening up a new tab. With
                  media integrations from Sketchfab and Google Poly, you&#39;ll be on your way to creating a scene in no
                  time.
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
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }
}
