import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./SnappingDropdown.scss";
import NumericInputGroup from "../inputs/NumericInputGroup";

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

export default class SnappingDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listOpen: false,
      headerTitle: "Snapping",
      snapTranslateValue: 0,
      snapRotateValue: 0
    };
  }

  componentDidMount() {
    this.props.editor.signals.viewportInitialized.add(this.onViewportInitialized);
  }

  onViewportInitialized = viewport => {
    this.setState({
      snapTranslateValue: viewport.spokeControls.translationSnap,
      snapRotateValue: (viewport.spokeControls.rotationSnap || 0) * RAD2DEG
    });
  };

  componentWillUnmount() {
    this.props.editor.signals.viewportInitialized.remove(this.onViewportInitialized);
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

  setSnapValue(type, value) {
    let v = value;
    switch (type) {
      case "translate":
        this.setState({ snapTranslateValue: value });
        this.props.editor.viewport.spokeControls.setTranslationSnapValue(v);
        break;
      case "rotate":
        this.setState({ snapRotateValue: v });
        v = v * DEG2RAD;
        this.props.editor.viewport.spokeControls.setRotationSnapValue(v);
        break;
      default:
        break;
    }
  }

  render() {
    const { snapTranslateValue, snapRotateValue } = this.state;
    return (
      <div className={classNames(styles.wrapper)}>
        <div className={styles.header} onClick={() => this.toggleList()}>
          <div className={styles.headerTitle}>{this.state.headerTitle}</div>
          {this.state.listOpen ? <i className="fa fa-angle-up fa-12px" /> : <i className="fa fa-angle-down fa-12px" />}
        </div>
        {this.state.listOpen && (
          <ul className={styles.list}>
            <li className={styles.listItem}>
              <NumericInputGroup
                className={styles.snappingInput}
                name="Move"
                value={snapTranslateValue}
                onChange={value => this.setSnapValue("translate", value)}
              />
            </li>
            <li className={styles.listItem}>
              <NumericInputGroup
                className={styles.snappingInput}
                name="Rotate"
                value={snapRotateValue}
                onChange={value => this.setSnapValue("rotate", value)}
              />
            </li>
          </ul>
        )}
      </div>
    );
  }
}

SnappingDropdown.propTypes = {
  editor: PropTypes.object
};
