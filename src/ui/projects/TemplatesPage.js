import React, { Component } from "react";
import PropTypes from "prop-types";
import NavBar from "../navigation/NavBar";
import ProjectGrid from "./ProjectGrid";
import Footer from "../navigation/Footer";
import templates from "./templates";
import PrimaryLink from "../inputs/PrimaryLink";
import { ProjectsSection, ProjectsContainer, ProjectsHeader } from "./ProjectsPage";

export default class TemplatesPage extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired
  };

  onSelectTemplate = template => {
    const search = new URLSearchParams();
    search.set("template", template.project_url);
    this.props.history.push(`/projects/new?${search}`);
  };

  render() {
    return (
      <>
        <NavBar />
        <main>
          <ProjectsSection>
            <ProjectsContainer>
              <ProjectsHeader>
                <h1>Templates</h1>
                <PrimaryLink to="/projects">Back to projects</PrimaryLink>
              </ProjectsHeader>
              <ProjectGrid projects={templates} onSelectProject={this.onSelectTemplate} />
            </ProjectsContainer>
          </ProjectsSection>
        </main>
        <Footer />
      </>
    );
  }
}
