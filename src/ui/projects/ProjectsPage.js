import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { withApi } from "../contexts/ApiContext";
import NavBar from "../navigation/NavBar";
import styles from "./ProjectsPage.scss";
import ProjectGrid from "./ProjectGrid";
import Footer from "../navigation/Footer";
import Loading from "../Loading";

class ProjectsPage extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      projects: [],
      loading: true,
      error: null
    };
  }

  componentDidMount() {
    this.props.api
      .getProjects()
      .then(projects => this.setState({ projects, loading: false }))
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

  render() {
    const { error, loading, projects } = this.state;

    return (
      <>
        <NavBar />
        <main>
          <section className={styles.projectsSection}>
            <div className={styles.projectsContainer}>
              <div className={styles.projectsHeader}>
                <h1>Projects</h1>
                <Link to="/projects/new">New Project</Link>
              </div>
              {loading && <Loading message="Loading projects..." />}
              {error ? (
                <div className={styles.error}>{error.message || "There was an unknown error."}</div>
              ) : (
                <ProjectGrid projects={projects} />
              )}
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }
}

export default withApi(ProjectsPage);
