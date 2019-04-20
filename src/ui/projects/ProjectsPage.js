import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { withApi } from "../contexts/ApiContext";
import NavBar from "../navigation/NavBar";
import styles from "./ProjectsPage.scss";
import ProjectGrid from "./ProjectGrid";
import Footer from "../navigation/Footer";
import Loading from "../Loading";
import { connectMenu, ContextMenu, MenuItem } from "react-contextmenu";
import "../styles/vendor/react-contextmenu/index.scss";
import defaultTemplateUrl from "file-loader!../../assets/templates/default.spoke";

const contextMenuId = "project-menu";

class ProjectsPage extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      projects: [],
      templates: [
        {
          id: "test",
          name: "Test",
          thumbnailUrl: "",
          url: defaultTemplateUrl
        }
      ],
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

  onDeleteProject = project => {
    this.props.api
      .deleteProject(project.id)
      .then(() => this.setState({ projects: this.state.projects.filter(p => p.id !== project.id) }))
      .catch(error => this.setState({ error }));
  };

  onNewProject = () => {
    this.props.history.push(`/projects/new`);
  };

  onOpenProject = project => {
    this.props.history.push(`/projects/${project.id}`);
  };

  onSelectTemplate = template => {
    const search = new URLSearchParams();
    search.set("template", template.url);
    this.props.history.push(`/projects/new?${search}`);
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
    const { error, loading, projects, templates } = this.state;

    let content;

    if (loading) {
      content = (
        <div className={styles.loadingContainer}>
          <Loading message="Loading projects..." />
        </div>
      );
    } else {
      content = (
        <ProjectGrid
          projects={projects}
          onNewProject={this.onNewProject}
          onSelectProject={this.onOpenProject}
          contextMenuId={contextMenuId}
        />
      );
    }

    const ProjectContextMenu = this.ProjectContextMenu;

    return (
      <>
        <NavBar />
        <main>
          <section className={styles.projectsSection}>
            <div className={styles.projectsContainer}>
              <div className={styles.projectsHeader}>
                <h1>Templates</h1>
              </div>
              <ProjectGrid projects={templates} onSelectProject={this.onSelectTemplate} />
            </div>
          </section>
          <section className={styles.projectsSection}>
            <div className={styles.projectsContainer}>
              <div className={styles.projectsHeader}>
                <h1>Projects</h1>
                <Link to="/projects/new">New Project</Link>
              </div>
              {error && <div className={styles.error}>{error.message || "There was an unknown error."}</div>}
              {content}
            </div>
          </section>
          <ProjectContextMenu />
        </main>
        <Footer />
      </>
    );
  }
}

export default withApi(ProjectsPage);
