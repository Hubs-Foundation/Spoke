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
    this.props.editor.addListener("initialized", this.onEditorInitialized);
  }

  onEditorInitialized = () => {
    const editor = this.props.editor;
    this.setState({
      snapTranslateValue: editor.spokeControls.translationSnap,
      snapRotateValue: (editor.spokeControls.rotationSnap || 0) * RAD2DEG
    });
  };

  componentWillUnmount() {
    this.props.editor.removeListener("initialized", this.onEditorInitialized);
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
        this.props.editor.spokeControls.setTranslationSnapValue(v);
        break;
      case "rotate":
        this.setState({ snapRotateValue: v });
        v = v * DEG2RAD;
        this.props.editor.spokeControls.setRotationSnapValue(v);
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
                smallStep={0.01}
                mediumStep={0.1}
                largeStep={1}
                value={snapTranslateValue}
                onChange={value => this.setSnapValue("translate", value)}
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
                value={snapRotateValue}
                onChange={value => this.setSnapValue("rotate", value)}
                unit="°"
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
