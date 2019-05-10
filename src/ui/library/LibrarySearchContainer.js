import React, { Component } from "react";
import PropTypes from "prop-types";
import LibraryPanel from "./LibraryPanel";
import SelectInput from "../inputs/SelectInput";
import FileInput from "../inputs/FileInput";
import { withDialog } from "../contexts/DialogContext";
import styles from "./LibrarySearchContainer.scss";
import ErrorDialog from "../dialogs/ErrorDialog";
import ProgressDialog from "../dialogs/ProgressDialog";

const filterFileTypes = {
  all: ".png,.jpeg,.jpg,.gif,.mp4,.glb,image/png,image/jpeg,image/gif,video/mp4,model/gltf-binary",
  image: ".png,.jpeg,.jpg,.gif,image/png, image/jpeg, image/gif",
  video: ".mp4,video/mp4",
  model: ".glb,model/gltf-binary"
};

class LibrarySearchContainer extends Component {
  static propTypes = {
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
    onSelect: PropTypes.func.isRequired,
    uploadMultiple: PropTypes.bool,
    onAfterUpload: PropTypes.func,
    tooltipId: PropTypes.string
  };

  static defaultProps = {
    uploadMultiple: true
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

  onUpload = async files => {
    const { showDialog, hideDialog, sources } = this.props;
    const selectedSource = sources.find(source => source.value === this.state.selectedSourceId);
    const abortController = new AbortController();

    showDialog(ProgressDialog, {
      title: "Uploading Files",
      message: `Uploading files 1 of ${files.length}: 0%`,
      cancelable: true,
      onCancel: () => {
        abortController.abort();
        hideDialog();
      }
    });

    try {
      const items = await selectedSource.onUpload(
        files,
        (item, total, progress) => {
          showDialog(ProgressDialog, {
            title: "Uploading Files",
            message: `Uploading files: ${item} of ${total}: ${Math.round(progress * 100)}%`,
            cancelable: true,
            onCancel: () => {
              abortController.abort();
              hideDialog();
            }
          });
        },
        abortController.signal
      );

      hideDialog();

      this.setState({
        items: [...items, ...this.state.items]
      });

      if (this.props.onAfterUpload) {
        this.props.onAfterUpload(items);
      }
    } catch (error) {
      console.error(error);
      showDialog(ErrorDialog, {
        title: "Upload Error",
        message: `Error uploading file: ${error.message || "There was an unknown error."}`,
        error
      });
    }
  };

  onLoadMore = () => {
    if (this.state.loading || this.state.nextCursor === null) {
      return;
    }

    this.update({ loading: true, cursor: this.state.nextCursor });
  };

  update(updateState) {
    if (this.state.abortController) {
      this.state.abortController.abort();
    }

    const { sources } = this.props;
    const abortController = new AbortController();
    const nextState = Object.assign({}, this.state, updateState, { abortController });
    const { selectedSourceId, filter, type, query, cursor } = nextState;
    const selectedSource = sources.find(source => source.value === selectedSourceId);

    this.setState(nextState);

    selectedSource
      .onSearch(selectedSourceId, { filter, type, query }, cursor, abortController.signal)
      .then(this.onResults)
      .catch(this.onError);
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
      this.setState({ loading: false, nextCursor: null });
    }
  };

  onAddItem = item => {
    this.setState({
      items: [item, ...this.state.items]
    });
  };

  onRemoveItem = item => {
    this.setState({
      items: this.state.items.filter(i => i !== item)
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
    const { onSelect, sources, uploadMultiple, tooltipId } = this.props;
    const { nextCursor, loading, selectedSourceId, filter, type, query, items } = this.state;
    const source = sources.find(source => source.value === selectedSourceId);
    const {
      filterOptions,
      filterIsClearable,
      typeOptions,
      typeIsClearable,
      searchPlaceholder,
      legal,
      privacyPolicyUrl,
      onUpload,
      contextMenu: ContextMenu
    } = source;

    return (
      <>
        <LibraryPanel
          hasMore={!!nextCursor}
          onLoadMore={this.onLoadMore}
          onSelect={item => onSelect(item, source)}
          items={items}
          loading={loading}
          tooltipId={tooltipId}
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
          {filterOptions && (filterOptions.length > 1 || filterIsClearable) && (
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
                  <a rel="noopener noreferrer" target="_blank" href={privacyPolicyUrl}>
                    Privacy Policy
                  </a>
                </>
              )}
            </span>
          </span>
          {onUpload && (
            <FileInput accept={filterFileTypes[type || "all"]} multiple={uploadMultiple} onChange={this.onUpload} />
          )}
        </LibraryPanel>
        {ContextMenu && <ContextMenu id={tooltipId} onAddItem={this.onAddItem} onRemoveItem={this.onRemoveItem} />}
      </>
    );
  }
}

export default withDialog(LibrarySearchContainer);
