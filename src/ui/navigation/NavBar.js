import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { withAuth } from "../contexts/AuthContext";
import styles from "./NavBar.scss";
import spokeIcon from "../../assets/spoke-icon.png";

class NavBar extends Component {
  static propTypes = {
    isAuthenticated: PropTypes.bool.isRequired
  };

  render() {
    return (
      <header className={styles.navBar}>
        <div className={styles.iconContainer}>
          <Link to="/">
            <img src={spokeIcon} alt="Spoke" />
          </Link>
        </div>
        <div className={styles.middleContainer}>
          <nav>
            <ul className={styles.navList}>
              <li>
                <a href="https://github.com/mozilla/spoke" rel="noopener noreferrer">
                  Source
                </a>
              </li>
              <li>
                <a href="https://discord.gg/wHmY4nd" rel="noopener noreferrer">
                  Community
                </a>
              </li>
              <li>
                <a href="https://hubs.mozilla.com" rel="noopener noreferrer">
                  Hubs
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <div className={styles.rightContainer}>
          <ul className={styles.navList}>
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
          </ul>
        </div>
      </header>
    );
  }
}

export default withAuth(NavBar);
