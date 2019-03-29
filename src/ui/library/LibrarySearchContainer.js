import React, { Component } from "react";
import PropTypes from "prop-types";
import LibraryPanel from "./LibraryPanel";
import SelectInput from "../inputs/SelectInput";
import FileInput from "../inputs/FileInput";
import { withApi } from "../contexts/ApiContext";
import { withEditor } from "../contexts/EditorContext";
import { withDialog } from "../contexts/DialogContext";
import styles from "./LibrarySearchContainer.scss";

const filterFileTypes = {
  all: ".png,.jpeg,.jpg,.gif,.mp4,.glb,image/png,image/jpeg,image/gif,video/mp4,model/gltf-binary",
  image: ".png,.jpeg,.jpg,.gif,image/png, image/jpeg, image/gif",
  video: ".mp4,video/mp4",
  model: ".glb,model/gltf-binary"
};

class LibrarySearchContainer extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    editor: PropTypes.object.isRequired,
    showDialog: PropTypes.func.isRequired,
    hideDialog: PropTypes.func.isRequired,
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

    const { value: selectedSourceId, defaultFilter: filter, defaultType: type } = props.sources[0];

    this.state = {
      nextCursor: null,
      cursor: 0,
      loading: true,
      selectedSourceId,
      items: [],
      filter,
      type,
      query: "",
      abortController: null
    };
  }

  componentDidMount() {
    this.update({});
  }

  onChangeSource = selectedSourceId => {
    const { defaultFilter, defaultType } = this.props.sources.find(source => source.value === selectedSourceId);

    this.update({
      selectedSourceId,
      filter: defaultFilter,
      type: defaultType,
      query: "",
      items: [],
      loading: true,
      cursor: 0,
      nextCursor: null
    });
  };

  onChangeFilter = filter => {
    this.update({ filter, items: [], loading: true, cursor: 0, nextCursor: null });
  };

  onChangeType = type => {
    this.update({ type, items: [], loading: true, cursor: 0, nextCursor: null });
  };

  onChangeQuery = e => {
    this.update({ query: e.target.value, items: [], loading: true, cursor: 0, nextCursor: null });
  };

  onUpload = files => {
    const { api, editor, showDialog, hideDialog } = this.props;
    api
      .uploadProjectAsset(editor.projectId, files[0], showDialog, hideDialog)
      .then(this.onAddItem)
      .catch(console.error);
  };

  onLoadMore = () => {
    if (this.state.loading || this.state.nextCursor === null) {
      return;
    }

    this.update({ loading: true, cursor: this.state.nextCursor });
  };

  update(updateState) {
    const nextState = Object.assign({}, this.state, updateState);

    const { sources } = this.props;
    const { selectedSourceId, filter, type, query, cursor } = nextState;
    const selectedSource = sources.find(source => source.value === selectedSourceId);

    if (this.state.abortController) {
      this.state.abortController.abort();
    }

    this.setState(nextState);

    const abortController = new AbortController();

    if (selectedSource.onSearch) {
      selectedSource
        .onSearch(selectedSourceId, { filter, type, query }, cursor, abortController.signal)
        .then(this.onResults)
        .catch(this.onError);
    } else {
      this.props.api
        .searchMedia(selectedSourceId, { filter, type, query }, cursor, abortController.signal)
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
    this.setState({
      items: [item, ...this.state.items]
    });
  };

  renderTooltip = id => {
    const item = this.state.items.find(r => r.id == id);

    if (!item || !item.name) {
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
    const { nextCursor, loading, selectedSourceId, filter, type, query, items } = this.state;
    const {
      filterOptions,
      filterIsClearable,
      typeOptions,
      typeIsClearable,
      searchPlaceholder,
      legal,
      privacyPolicyUrl,
      upload
    } = sources.find(source => source.value === selectedSourceId);

    return (
      <LibraryPanel
        hasMore={!!nextCursor}
        onLoadMore={this.onLoadMore}
        onSelect={onSelect}
        items={items}
        loading={loading}
        renderTooltip={this.renderTooltip}
      >
        {sources.length > 1 && (
          <span className={styles.sourceInputContainer}>
            <SelectInput options={sources} value={selectedSourceId} onChange={this.onChangeSource} />
          </span>
        )}
        {typeOptions && typeOptions.length > 1 && (
          <span className={styles.filterInputContainer}>
            <SelectInput
              placeholder="Type..."
              isClearable={typeIsClearable}
              options={typeOptions}
              value={type}
              onChange={this.onChangeType}
            />
          </span>
        )}
        {filterOptions && filterOptions.length > 1 && (
          <span className={styles.filterInputContainer}>
            <SelectInput
              placeholder="Filter..."
              isClearable={filterIsClearable}
              options={filterOptions}
              value={filter}
              onChange={this.onChangeFilter}
            />
          </span>
        )}
        <span className={styles.searchContainer}>
          <input placeholder={searchPlaceholder} value={query} onChange={this.onChangeQuery} />
          <span>
            {legal}
            {privacyPolicyUrl && (
              <>
                <span> | </span>
                <a rel="noopener noreferrer" href={privacyPolicyUrl}>
                  Privacy Policy
                </a>
              </>
            )}
          </span>
        </span>
        {upload && <FileInput accept={filterFileTypes[type || "all"]} onChange={this.onUpload} />}
      </LibraryPanel>
    );
  }
}

export default withApi(withEditor(withDialog(LibrarySearchContainer)));
