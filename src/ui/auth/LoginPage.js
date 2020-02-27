import React, { useContext } from "react";
import { Redirect } from "react-router-dom";
import { ApiContext } from "../contexts/ApiContext";
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

export default function LoginPage() {
  const api = useContext(ApiContext);

  if (api.isAuthenticated()) {
    return <Redirect to="/projects" />;
  }

  const AuthContainer = api.getAuthContainer();

  return (
    <>
      <NavBar />
      <main>
        <LoginSection>
          <LoginContainer>
            <AuthContainer />
          </LoginContainer>
        </LoginSection>
      </main>
      <Footer />
    </>
  );
}
