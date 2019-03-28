import React, { Component } from "react";
import PropTypes from "prop-types";
import LibraryPanel from "./LibraryPanel";
import LibrarySourceInput from "./LibrarySourceInput";
import { withApi } from "../contexts/ApiContext";

class LibrarySearchContainer extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    sources: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        toolbar: PropTypes.elementType,
        toolbarProps: PropTypes.object,
        onSearch: PropTypes.func
      })
    ).isRequired,
    onSelect: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      nextCursor: null,
      cursor: 0,
      hasMore: true,
      loading: true,
      selectedSourceId: props.sources[0].value,
      items: [],
      params: null,
      abortController: null
    };
  }

  onChangeSource = selectedSourceId => {
    this.update({
      selectedSourceId,
      params: null,
      items: [],
      loading: true,
      hasMore: true,
      cursor: 0,
      nextCursor: null
    });
  };

  onChangeSearchParams = params => {
    this.update({ params, items: [], loading: true, hasMore: true, cursor: 0, nextCursor: null });
  };

  onLoadMore = () => {
    if (this.state.loading || this.state.nextCursor === null) {
      return;
    }

    this.update({ loading: true, cursor: this.state.nextCursor, hasMore: this.state.cursor < this.state.nextCursor });
  };

  update(updateState) {
    console.log("update", updateState);
    const nextState = Object.assign({}, this.state, updateState);

    const { sources } = this.props;
    const { selectedSourceId, params, cursor } = nextState;
    const selectedSource = sources.find(source => source.value === selectedSourceId);

    if (this.state.abortController) {
      this.state.abortController.abort();
    }

    this.setState(nextState);

    if (!params) {
      return;
    }

    const abortController = new AbortController();

    if (selectedSource.onSearch) {
      selectedSource
        .onSearch(selectedSourceId, params, cursor, abortController.signal)
        .then(this.onResults)
        .catch(this.onError);
    } else {
      this.props.api
        .searchMedia(selectedSourceId, params, cursor, abortController.signal)
        .then(this.onResults)
        .catch(this.onError);
    }
  }

  onResults = ({ results, nextCursor }) => {
    this.setState({
      loading: false,
      items: [...this.state.items, ...results],
      nextCursor
    });
  };

  onError = err => {
    if (err.name !== "AbortError") {
      console.error(err);
      this.setState({ loading: false });
    }
  };

  onAddItem = item => {
    console.log(item);
    this.setState({
      items: [item, ...this.state.items]
    });
  };

  renderTooltip = id => {
    const item = this.state.items.find(r => r.id == id);

    if (!item || item.name == null) {
      return null;
    }

    return (
      <div>
        <div>{item.name}</div>
        {item.attributions && item.attributions.game && <div>playing {item.attributions.game.name}</div>}
        {item.attributions && item.attributions.creator && <div>by {item.attributions.creator.name}</div>}
      </div>
    );
  };

  render() {
    const { onSelect, sources } = this.props;
    const { hasMore, loading, selectedSourceId, items } = this.state;
    const selectedSource = sources.find(source => source.value === selectedSourceId);
    const SourceToolbar = selectedSource.toolbar;
    const toolbarProps = selectedSource.toolbarProps || {};

    return (
      <LibraryPanel
        hasMore={hasMore}
        onLoadMore={this.onLoadMore}
        onSelect={onSelect}
        items={items}
        loading={loading}
        renderTooltip={this.renderTooltip}
      >
        {sources.length > 1 && (
          <LibrarySourceInput options={sources} value={selectedSourceId} onChange={this.onChangeSource} />
        )}
        <SourceToolbar onChangeSearchParams={this.onChangeSearchParams} onAddItem={this.onAddItem} {...toolbarProps} />
      </LibraryPanel>
    );
  }
}

export default withApi(LibrarySearchContainer);
