import React, { Component } from "react";
import PropTypes from "prop-types";
import LibraryFilterInput from "./LibraryFilterInput";
import LibrarySearchInput from "./LibrarySearchInput";

export default class FilterSearchToolbar extends Component {
  static propTypes = {
    defaultFilter: PropTypes.string,
    filterOptions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string
      })
    ),
    searchPlaceholder: PropTypes.string,
    legal: PropTypes.string,
    privacyPolicyUrl: PropTypes.string,
    onChangeSearchParams: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      filter: props.defaultFilter,
      q: ""
    };
  }

  componentDidMount() {
    console.log("componentDidMount");
    this.props.onChangeSearchParams(this.state);
  }

  onChangeFilter = filter => {
    this.setState({ filter });
    this.props.onChangeSearchParams({ filter, q: this.state.q });
  };

  onChangeQuery = e => {
    const q = e.target.value;
    this.setState({ q });
    this.props.onChangeSearchParams({ filter: this.state.filter, q });
  };

  render() {
    return (
      <>
        <LibraryFilterInput
          options={this.props.filterOptions}
          value={this.state.filter}
          onChange={this.onChangeFilter}
        />
        <LibrarySearchInput
          placeholder={this.props.searchPlaceholder}
          value={this.state.q}
          onChange={this.onChangeQuery}
          legal={this.props.legal}
          privacyPolicyUrl={this.props.privacyPolicyUrl}
        />
      </>
    );
  }
}
