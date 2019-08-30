import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./SnappingDropdown.scss";
import NumericInputGroup from "../inputs/NumericInputGroup";

export default class SnappingDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listOpen: false
    };
  }

  handleClickOutside() {
    this.setState({
      listOpen: false
    });
  }

  toggleList() {
    this.setState(prevState => ({
      listOpen: !prevState.listOpen
    }));
  }

  render() {
    return (
      <div className={classNames(styles.wrapper)}>
        <div className={styles.header} onClick={() => this.toggleList()}>
          <div className={styles.headerTitle}>Snapping</div>
          {this.state.listOpen ? <i className="fa fa-angle-up fa-12px" /> : <i className="fa fa-angle-down fa-12px" />}
        </div>
        {this.state.listOpen && (
          <ul className={styles.list}>
            <li className={styles.listItem}>
              <NumericInputGroup
                className={styles.snappingInput}
                name="Move"
                smallStep={0.01}
                mediumStep={0.1}
                largeStep={1}
                value={this.props.translationSnap}
                onChange={this.props.onChangeTranslationSnap}
                unit="m"
              />
            </li>
            <li className={styles.listItem}>
              <NumericInputGroup
                className={styles.snappingInput}
                name="Rotate"
                smallStep={1}
                mediumStep={15}
                largeStep={45}
                value={this.props.rotationSnap}
                onChange={this.props.onChangeRotationSnap}
                unit="°"
              />
            </li>
            <li className={styles.listItem}>
              <NumericInputGroup
                className={styles.snappingInput}
                name="Scale"
                smallStep={1}
                mediumStep={15}
                largeStep={45}
                value={this.props.scaleSnap}
                onChange={this.props.onChangeScaleSnap}
              />
            </li>
          </ul>
        )}
      </div>
    );
  }
}

SnappingDropdown.propTypes = {
  translationSnap: PropTypes.number,
  rotationSnap: PropTypes.number,
  scaleSnap: PropTypes.number,
  onChangeTranslationSnap: PropTypes.func,
  onChangeRotationSnap: PropTypes.func,
  onChangeScaleSnap: PropTypes.func
};
