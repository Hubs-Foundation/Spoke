import React, { Component } from "react";
import PropTypes from "prop-types";
import { withApi } from "../contexts/ApiContext";
import NavBar from "../navigation/NavBar";
import ProjectGrid from "./ProjectGrid";
import Footer from "../navigation/Footer";
import Button from "../inputs/Button";
import Loading from "../Loading";
import LatestUpdate from "../whats-new/LatestUpdate";
import { connectMenu, ContextMenu, MenuItem } from "react-contextmenu";
import "../styles/vendor/react-contextmenu/index.scss";
import templates from "./templates";
import styled from "styled-components";

export const ProjectsSection = styled.section`
  padding-bottom: 100px;
  display: flex;

  &:first-child {
    padding-top: 100px;
  }

  h1 {
    font-size: 36px;
  }

  h2 {
    font-size: 16px;
  }
`;

export const ProjectsContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  margin: 0 auto;
  max-width: 1200px;
  padding: 0 20px;
`;

const WelcomeContainer = styled(ProjectsContainer)`
  align-items: center;

  & > * {
    text-align: center;
  }

  & > *:not(:first-child) {
    margin-top: 20px;
  }

  h2 {
    max-width: 480px;
  }
`;

export const ProjectsHeader = styled.div`
  margin-bottom: 36px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex: 1;
`;

const ErrorMessage = styled.div`
  margin-bottom: 20px;
  color: ${props => props.theme.red};
`;

const contextMenuId = "project-menu";

class ProjectsPage extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    const isAuthenticated = this.props.api.isAuthenticated();

    this.state = {
      projects: [],
      loading: isAuthenticated,
      isAuthenticated,
      error: null
    };
  }

  componentDidMount() {
    // We dont need to load projects if the user isn't logged in
    if (this.state.isAuthenticated) {
      this.props.api
        .getProjects()
        .then(projects => {
          this.setState({
            projects: projects.map(project => ({
              ...project,
              url: `/projects/${project.id}`
            })),
            loading: false
          });
        })
        .catch(error => {
          console.error(error);

          if (error.response && error.response.status === 401) {
            // User has an invalid auth token. Prompt them to login again.
            this.props.api.logout();
            return this.props.history.push("/login", { from: "/projects" });
          }

          this.setState({ error, loading: false });
        });
    }
  }

  onDeleteProject = project => {
    this.props.api
      .deleteProject(project.id)
      .then(() => this.setState({ projects: this.state.projects.filter(p => p.id !== project.id) }))
      .catch(error => this.setState({ error }));
  };

  renderContextMenu = props => {
    return (
      <ContextMenu id={contextMenuId}>
        <MenuItem onClick={e => this.onDeleteProject(props.trigger.project, e)}>Delete Project</MenuItem>
      </ContextMenu>
    );
  };

  ProjectContextMenu = connectMenu(contextMenuId)(this.renderContextMenu);

  render() {
    const { error, loading, projects, isAuthenticated } = this.state;

    let content;

    if (loading) {
      content = (
        <LoadingContainer>
          <Loading message="Loading projects..." />
        </LoadingContainer>
      );
    } else {
      content = <ProjectGrid projects={projects} newProjectUrl="/projects/templates" contextMenuId={contextMenuId} />;
    }

    const ProjectContextMenu = this.ProjectContextMenu;

    const topTemplates = [];

    for (let i = 0; i < templates.length && i < 4; i++) {
      topTemplates.push(templates[i]);
    }

    return (
      <>
        <NavBar />
        <main>
          {!isAuthenticated || (projects.length === 0 && !loading) ? (
            <ProjectsSection>
              <WelcomeContainer>
                <h1>Welcome to Spoke</h1>
                <h2>
                  If you&#39;re new here we recommend going through the tutorial. Otherwise, jump right in and create a
                  project from scratch or one of our templates.
                </h2>
                <Button medium to="/projects/tutorial">
                  Start Tutorial
                </Button>
              </WelcomeContainer>
            </ProjectsSection>
          ) : (
            <LatestUpdate />
          )}
          <ProjectsSection>
            <ProjectsContainer>
              <ProjectsHeader>
                <h1>Projects</h1>
                <Button medium to="/projects/templates">
                  New Project
                </Button>
              </ProjectsHeader>
              {error && <ErrorMessage>{error.message || "There was an unknown error."}</ErrorMessage>}
              {content}
            </ProjectsContainer>
          </ProjectsSection>
          <ProjectContextMenu />
        </main>
        <Footer />
      </>
    );
  }
}

export default withApi(ProjectsPage);
