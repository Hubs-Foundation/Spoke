import React, { Component } from "react";
import PropTypes from "prop-types";
import LibrarySearchInput from "./LibrarySearchInput";

export default class BaseSearchToolbar extends Component {
  static propTypes = {
    searchPlaceholder: PropTypes.string,
    legal: PropTypes.string,
    privacyPolicyUrl: PropTypes.string,
    onChangeSearchParams: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      q: ""
    };
  }

  componentDidMount() {
    this.props.onChangeSearchParams(this.state);
  }

  onChangeQuery = e => {
    const q = e.target.value;
    this.setState({ q });
    this.props.onChangeSearchParams({ q });
  };

  render() {
    return (
      <>
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
