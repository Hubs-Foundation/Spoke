import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./LibrarySearchInput.scss";

export default class LibrarySearchInput extends Component {
  static propTypes = {
    legal: PropTypes.string,
    privacyPolicyUrl: PropTypes.string
  };

  render() {
    const { legal, privacyPolicyUrl, ...props } = this.props;

    return (
      <span className={styles.searchContainer}>
        <input {...props} />
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
    );
  }
}
