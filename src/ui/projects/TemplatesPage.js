import React, { useCallback } from "react";
import PropTypes from "prop-types";
import NavBar from "../navigation/NavBar";
import ProjectGrid from "./ProjectGrid";
import Footer from "../navigation/Footer";
import templates from "./templates";
import PrimaryLink from "../inputs/PrimaryLink";
import { ProjectsSection, ProjectsContainer, ProjectsHeader } from "./ProjectsPage";
import styled from "styled-components";
import { Row } from "../layout/Flex";
import { Button } from "../inputs/Button";
import StringInput from "../inputs/StringInput";

const ProjectGridContainer = styled.div`
  background-color: ${props => props.theme.panel2};
  border-radius: 3px;
`;

const ProjectGridContent = styled.div`
  padding: 20px;
`;

const ProjectGridHeader = styled.div`
  display: flex;
  background-color: ${props => props.theme.toolbar2};
  border-radius: 3px 3px 0px 0px;
  height: 48px;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
`;

const Separator = styled.div`
  height: 48px;
  width: 1px;
  background-color: ${props => props.theme.border};
  margin: 0 20px;
`;

const ProjectGridHeaderRow = styled(Row)`
  align-items: center;
`;

const SearchInput = styled(StringInput)`
  width: auto;
  min-width: 180px;
`;

export default function TemplatesPage({ history }) {
  const onSelectTemplate = useCallback(
    template => {
      const search = new URLSearchParams();
      search.set("template", template.url);
      history.push(`/projects/new?${search}`);
    },
    [history]
  );

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
            <ProjectGridContainer>
              <ProjectGridHeader>
                <ProjectGridHeaderRow>
                  <PrimaryLink>Featured</PrimaryLink>
                  <Separator />
                  <SearchInput placeholder="Search scenes..." />
                </ProjectGridHeaderRow>
                <ProjectGridHeaderRow>
                  <Button>New Empty Scene</Button>
                </ProjectGridHeaderRow>
              </ProjectGridHeader>
              <ProjectGridContent>
                <ProjectGrid projects={templates} onSelectProject={onSelectTemplate} />
              </ProjectGridContent>
            </ProjectGridContainer>
          </ProjectsContainer>
        </ProjectsSection>
      </main>
      <Footer />
    </>
  );
}

TemplatesPage.propTypes = {
  history: PropTypes.object.isRequired
};
