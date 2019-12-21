import React, { useCallback, useEffect, useState, useContext, useRef } from "react";
import PropTypes from "prop-types";
import NavBar from "../navigation/NavBar";
import {
  ProjectGrid,
  ProjectGridContainer,
  ProjectGridHeader,
  ProjectGridHeaderRow,
  Filter,
  Separator,
  SearchInput,
  ProjectGridContent,
  CenteredMessage,
  ErrorMessage
} from "./ProjectGrid";
import Footer from "../navigation/Footer";
import PrimaryLink from "../inputs/PrimaryLink";
import { Button } from "../inputs/Button";
import { ProjectsSection, ProjectsContainer, ProjectsHeader } from "./ProjectsPage";
import { ApiContext } from "../contexts/ApiContext";
import { Link } from "react-router-dom";

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

  const onSetAll = useCallback(() => {
    setFilter("remixable");
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
        console.log(results);
        setResults(
          results.map(result => ({
            ...result,
            url: `/projects/new?sceneId=${result.id}`,
            thumbnail_url: result && result.images && result.images.preview && result.images.preview.url
          }))
        );
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
                  <Filter onClick={onSetFeaturedRemixable} active={filter === "featured-remixable"}>
                    Featured
                  </Filter>
                  <Filter onClick={onSetAll} active={filter === "remixable"}>
                    All
                  </Filter>
                  <Separator />
                  <SearchInput placeholder="Search scenes..." value={query} onChange={onChangeQuery} />
                </ProjectGridHeaderRow>
                <ProjectGridHeaderRow>
                  <Button as={Link} to="/projects/new">
                    New Empty Project
                  </Button>
                </ProjectGridHeaderRow>
              </ProjectGridHeader>
              <ProjectGridContent>
                {error && <ErrorMessage>{error.message}</ErrorMessage>}
                {loading && <CenteredMessage>Searching scenes...</CenteredMessage>}
                {!error && !loading && (
                  <ProjectGrid
                    projects={results}
                    newProjectPath="/projects/new"
                    newProjectLabel="New Empty Project"
                    onSelectProject={onSelectScene}
                  />
                )}
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
