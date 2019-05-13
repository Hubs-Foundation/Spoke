import React, { Component } from "react";
import PropTypes from "prop-types";
import NavBar from "../navigation/NavBar";
import styles from "./ProjectsPage.scss";
import ProjectGrid from "./ProjectGrid";
import Footer from "../navigation/Footer";
import templates from "./templates";
import PrimaryLink from "../inputs/PrimaryLink";

export default class TemplatesPage extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired
  };

  onSelectTemplate = template => {
    const search = new URLSearchParams();
    search.set("template", template.url);
    this.props.history.push(`/projects/new?${search}`);
  };

  render() {
    return (
      <>
        <NavBar />
        <main>
          <section className={styles.projectsSection}>
            <div className={styles.projectsContainer}>
              <div className={styles.projectsHeader}>
                <h1>Templates</h1>
                <PrimaryLink to="/projects">Back to projects</PrimaryLink>
              </div>
              <ProjectGrid projects={templates} onSelectProject={this.onSelectTemplate} />
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }
}
