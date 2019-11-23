import React, { useCallback, useEffect, useState, useContext, useRef } from "react";
import PropTypes from "prop-types";
import NavBar from "../navigation/NavBar";
import ProjectGrid from "./ProjectGrid";
import Footer from "../navigation/Footer";
import PrimaryLink from "../inputs/PrimaryLink";
import { ProjectsSection, ProjectsContainer, ProjectsHeader } from "./ProjectsPage";
import styled from "styled-components";
import { Row } from "../layout/Flex";
import { Button } from "../inputs/Button";
import StringInput from "../inputs/StringInput";
import { ApiContext } from "../contexts/ApiContext";
import { Link } from "react-router-dom";

const ProjectGridContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  background-color: ${props => props.theme.panel2};
  border-radius: 3px;
`;

const ProjectGridContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
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

const Filter = styled.a`
  font-size: 1.25em;
  cursor: pointer;
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

const CenteredMessage = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const ErrorMessage = styled(CenteredMessage)`
  color: ${props => props.theme.red};
`;

export default function CreateProjectPage({ history, location }) {
  const queryParams = new URLSearchParams(location.search);
  const api = useContext(ApiContext);
  const abortControllerRef = useRef();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const [query, setQuery] = useState(queryParams.get("q") || "");
  const [filter, setFilter] = useState(queryParams.get("filter") || "featured-remixable");
  const [results, setResults] = useState([]);
  const [cursor, setCursor] = useState();
  const [_nextCursor, setNextCursor] = useState();

  const onChangeQuery = useCallback(
    value => {
      setFilter("remixable");
      setQuery(value.trim());
      setCursor();
      setNextCursor();
    },
    [setFilter, setQuery]
  );

  const onSetFeaturedRemixable = useCallback(() => {
    setFilter("featured-remixable");
    setQuery("");
    setCursor();
    setNextCursor();
  }, [setFilter]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    const search = new URLSearchParams();

    search.set("filter", filter);

    if (query !== "") {
      search.set("q", query);
    }

    history.push(`/projects/create?${search}`);

    api
      .searchMedia("scene_listings", { filter, query }, cursor, abortControllerRef.current.signal)
      .then(({ results, nextCursor }) => {
        setResults(results);
        setNextCursor(nextCursor);
        setLoading(false);
      })
      .catch(err => {
        if (err.name === "AbortError") return;
        setError(err);
        setResults([]);
        setNextCursor();
        setLoading(false);
      });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [api, filter, query, cursor, setResults, setNextCursor, setError, setLoading]);

  // TODO: Add infinite scrolling
  // const hasMore = !!nextCursor;

  // const loadMore = useCallback(() => {
  //   setCursor(nextCursor);
  // }, [nextCursor, setCursor]);

  const onSelectScene = useCallback(
    scene => {
      const search = new URLSearchParams();
      search.set("sceneId", scene.id);
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
              <h1>New Project</h1>
              <PrimaryLink to="/projects">Back to projects</PrimaryLink>
            </ProjectsHeader>
            <ProjectGridContainer>
              <ProjectGridHeader>
                <ProjectGridHeaderRow>
                  <Filter onClick={onSetFeaturedRemixable}>Featured</Filter>
                  <Separator />
                  <SearchInput placeholder="Search scenes..." value={query} onChange={onChangeQuery} />
                </ProjectGridHeaderRow>
                <ProjectGridHeaderRow>
                  <Button as={Link} to="/projects/new">
                    New Empty Scene
                  </Button>
                </ProjectGridHeaderRow>
              </ProjectGridHeader>
              <ProjectGridContent>
                {error && <ErrorMessage>{error.message}</ErrorMessage>}
                {loading && <CenteredMessage>Searching scenes...</CenteredMessage>}
                {results.length === 0 && !loading && !error && <CenteredMessage>No Results</CenteredMessage>}
                <ProjectGrid projects={results} onSelectProject={onSelectScene} />
              </ProjectGridContent>
            </ProjectGridContainer>
          </ProjectsContainer>
        </ProjectsSection>
      </main>
      <Footer />
    </>
  );
}

CreateProjectPage.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
};
