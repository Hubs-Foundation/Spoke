import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import PropTypes from "prop-types";
import { withApi } from "../contexts/ApiContext";
import NavBar from "../navigation/NavBar";
import Footer from "../navigation/Footer";
import styled from "styled-components";

const LoginSection = styled.section`
  padding: 100px 0;
`;

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 60px;
  margin: 0 auto;
  max-width: 480px;
  background: ${props => props.theme.panel};
  border-radius: 8px;
`;

class LoginPage extends Component {
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
    if (this.state.redirectToReferrer || this.props.api.isAuthenticated()) {
      const location = this.props.location;
      const from = location.state ? location.state.from : "/projects";
      return <Redirect to={from} />;
    }

    const AuthContainer = this.props.api.getAuthContainer();

    return (
      <>
        <NavBar />
        <main>
          <LoginSection>
            <LoginContainer>
              <AuthContainer {...this.props} onSuccess={this.onSuccess} />
            </LoginContainer>
          </LoginSection>
        </main>
        <Footer />
      </>
    );
  }
}

export default withApi(LoginPage);
