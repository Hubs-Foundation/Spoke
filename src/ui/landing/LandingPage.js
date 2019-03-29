import React, { Component } from "react";
import { Link } from "react-router-dom";
import styles from "./LandingPage.scss";
import spokeLogo from "../../assets/spoke-logo.png";
import landingVideoMp4 from "../../assets/video/landing-video.mp4";
import landingVideoWebm from "../../assets/video/landing-video.webm";
import NavBar from "../navigation/NavBar";
import Footer from "../navigation/Footer";

export default class LandingPage extends Component {
  render() {
    return (
      <>
        <NavBar />
        <main>
          <section className={styles.heroSection}>
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
                <Link className={styles.linkButtonPrimary} to="/projects">
                  Get Started
                </Link>
              </div>
              <div className={styles.heroRight}>
                <video playsInline loop autoPlay muted>
                  <source src={landingVideoMp4} type="video/mp4" />
                  <source src={landingVideoWebm} type="video/webm" />
                </video>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }
}
