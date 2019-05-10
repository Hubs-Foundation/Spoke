import React, { Component } from "react";
import styles from "./Footer.scss";
import mozillaLogo from "../../assets/mozilla-logo.png";

export default class Footer extends Component {
  render() {
    return (
      <footer className={styles.footer}>
        <nav>
          <ul className={styles.navList}>
            <li className={styles.mobileOnly}>
              <a href="https://github.com/mozilla/Spoke" rel="noopener noreferrer">
                Source
              </a>
            </li>
            <li className={styles.mobileOnly}>
              <a href="https://discord.gg/wHmY4nd" rel="noopener noreferrer">
                Community
              </a>
            </li>
            <li className={styles.mobileOnly}>
              <a href="https://hubs.mozilla.com" rel="noopener noreferrer">
                Hubs
              </a>
            </li>
            <li>
              <a href="https://github.com/mozilla/hubs/blob/master/TERMS.md" rel="noopener noreferrer">
                Terms of Use
              </a>
            </li>
            <li>
              <a href="https://github.com/mozilla/hubs/blob/master/PRIVACY.md" rel="noopener noreferrer">
                Privacy Notice
              </a>
            </li>
            <li>
              <a href="https://mozilla.com" rel="noopener noreferrer">
                <img alt="Mozilla" src={mozillaLogo} />
              </a>
            </li>
          </ul>
        </nav>
      </footer>
    );
  }
}
