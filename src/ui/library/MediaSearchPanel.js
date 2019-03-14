import React, { Component } from "react";
import { withApi } from "../contexts/ApiContext";
import { withEditor } from "../contexts/EditorContext";
import PropTypes from "prop-types";
import SelectInput from "../inputs/SelectInput";
import LibraryGrid from "./LibraryGrid";
import LibraryPanel from "./LibraryPanel";
import InfiniteScroll from "react-infinite-scroller";
import LibraryGridScrollContainer from "./LibraryGridScrollContainer";
import styles from "./MediaSearchPanel.scss";
import Tooltip from "react-tooltip";

class MediaSearchPanel extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    api: PropTypes.object.isRequired,
    sources: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    const initialSource = props.sources[0];

    this.state = {
      loading: false,
      cursor: 0,
      nextCursor: null,
      selectedSourceId: initialSource.id,
      selectedFilter: initialSource.defaultFilter || null,
      value: "",
      abortController: null,
      results: []
    };
  }

  componentDidMount() {
    if (this.state.selectedFilter) {
      this.search(this.state.value, this.state.selectedSourceId, this.state.selectedFilter);
    }
  }

  onChangeSource = sourceId => {
    const source = this.props.sources.find(s => s.id === sourceId);
    this.search(this.state.value, sourceId, source.defaultFilter);
  };

  onChangeFilter = filter => {
    this.search(this.state.value, this.state.selectedSourceId, filter);
  };

  onLoadMore = () => {
    this.search(this.state.value, this.state.selectedSourceId, this.state.selectedFilter, this.state.nextCursor);
  };

  onChange = e => {
    if (this.state.abortController) {
      this.state.abortController.abort();
    }

    this.search(e.target.value, this.state.selectedSourceId, this.state.selectedFilter);
  };

  search = (value, sourceId, filter, cursor = 0) => {
    const abortController = new AbortController();

    const nextState = {
      loading: true,
      value,
      selectedSourceId: sourceId,
      selectedFilter: filter,
      cursor,
      abortController
    };

    if (cursor === 0) {
      nextState.results = [];
    }

    this.setState(nextState);

    this.props.api
      .searchMedia(sourceId, value, filter, cursor, abortController.signal)
      .then(this.onResults)
      .catch(this.onError);
  };

  onResults = ({ results, nextCursor }) => {
    this.setState({
      loading: false,
      results: this.state.cursor === 0 ? results : this.state.results.concat(results),
      cursor: this.state.nextCursor,
      nextCursor
    });
  };

  onError = err => {
    if (err.name !== "AbortError") {
      console.error(err);
      this.setState({ loading: false });
    }
  };

  componentDidUpdate() {
    Tooltip.rebuild();
  }

  renderTooltip = resultId => {
    const result = this.state.results.find(r => r.id == resultId);

    if (!result || result.name == null) {
      return null;
    }

    return (
      <div>
        <div>{result.name}</div>
        {result.attributions.game && <div>playing {result.attributions.game.name}</div>}
        {result.attributions.creator && <div>by {result.attributions.creator.name}</div>}
      </div>
    );
  };

  render() {
    const { value, results, selectedSourceId, selectedFilter, cursor, nextCursor, loading } = this.state;
    const sources = this.props.sources;
    const source = sources.find(s => s.id === selectedSourceId);
    const filters = source.filters || [];

    const items = results.map(result => ({
      id: result.id,
      thumbnailUrl: result.images.preview.url,
      url: result.url
    }));

    const sourceOptions = sources.map(s => ({ label: s.label, value: s.id }));
    const filterOptions = filters.map(f => ({ label: f, value: f }));

    return (
      <LibraryPanel>
        <div className={styles.searchBar}>
          {sources.length > 1 && (
            <span className={styles.sourceInputContainer}>
              <SelectInput options={sourceOptions} value={selectedSourceId} onChange={this.onChangeSource} />
            </span>
          )}
          {filters.length > 0 && (
            <span className={styles.filterInputContainer}>
              <SelectInput
                placeholder="Filter..."
                isClearable
                options={filterOptions}
                value={selectedFilter}
                onChange={this.onChangeFilter}
              />
            </span>
          )}
          <span className={styles.searchContainer}>
            <input placeholder={source.placeholder} onChange={this.onChange} value={value} />
            <span className={styles.legal}>
              {source.legal} |{" "}
              <a rel="noopener noreferrer" href={source.privacyPolicyUrl}>
                Privacy Policy
              </a>
            </span>
          </span>
        </div>
        <LibraryGridScrollContainer>
          <InfiniteScroll
            pageStart={0}
            loadMore={this.onLoadMore}
            hasMore={cursor < nextCursor}
            threshold={50}
            useWindow={false}
          >
            <LibraryGrid items={items} onSelect={this.props.onSelect} renderTooltip={this.renderTooltip}>
              {loading && <div className={styles.loadingItem}>Loading...</div>}
            </LibraryGrid>
          </InfiniteScroll>
        </LibraryGridScrollContainer>
      </LibraryPanel>
    );
  }
}

export default withApi(withEditor(MediaSearchPanel));
