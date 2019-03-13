import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import PropTypes from "prop-types";
import { withApi } from "./contexts/ApiContext";
import styles from "./AuthPage.scss";
import NavBar from "./NavBar";

class AuthPage extends Component {
  static propTypes = {
    location: PropTypes.object.isRequired,
    api: PropTypes.object.isRequired
  };

  state = {
    redirectToReferrer: false
  };

  onSuccess = () => {
    this.setState({ redirectToReferrer: true });
  };

  render() {
    if (this.state.redirectToReferrer) {
      const location = this.props.location;
      const from = location.state ? location.state.from : "/projects";
      return <Redirect to={from} />;
    }

    const AuthContainer = this.props.api.getAuthContainer();

    return (
      <>
        <NavBar />
        <main>
          <section className={styles.loginSection}>
            <div className={styles.loginContainer}>
              <h1>Login</h1>
              <AuthContainer {...this.props} onSuccess={this.onSuccess} />
            </div>
          </section>
        </main>
      </>
    );
  }
}

export default withApi(AuthPage);
