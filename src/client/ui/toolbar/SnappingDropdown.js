import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./SnappingDropdown.scss";
import NumericInput from "../inputs/NumericInput";
import InputGroup from "../inputs/InputGroup";

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

export default class SnappingDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listOpen: false,
      headerTitle: "Snapping",
      snapMoveValue: 0,
      snapRotateValue: 0
    };
  }

  componentDidMount() {
    this.props.editor.signals.viewportInitialized.add(this.onViewportInitialized);
  }

  onViewportInitialized = viewport => {
    this.setState({
      snapMoveValue: viewport.snapValues.translationSnap,
      snapRotateValue: (viewport.snapValues.rotationSnap || 0) * RAD2DEG
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
        this.setState({ snapMoveValue: value });
        break;
      case "rotate":
        this.setState({ snapRotateValue: v });
        v = v * DEG2RAD;
        break;
      default:
        break;
    }
    this.props.editor.signals.snapValueChanged.dispatch({
      type: type,
      value: v
    });
  }

  render() {
    const { snapMoveValue, snapRotateValue } = this.state;
    return (
      <div className={classNames(styles.wrapper)}>
        <div className={styles.header} onClick={() => this.toggleList()}>
          <div className={styles.headerTitle}>{this.state.headerTitle}</div>
          {this.state.listOpen ? <i className="fa fa-angle-up fa-12px" /> : <i className="fa fa-angle-down fa-12px" />}
        </div>
        {this.state.listOpen && (
          <ul className={styles.list}>
            <li className={styles.listItem}>
              <InputGroup className={styles.snappingInput} name={"Move"}>
                <NumericInput value={snapMoveValue} onChange={value => this.setSnapValue("translate", value)} />
              </InputGroup>
            </li>
            <li className={styles.listItem}>
              <InputGroup className={styles.snappingInput} name={"Rotate"}>
                <NumericInput value={snapRotateValue} onChange={value => this.setSnapValue("rotate", value)} />
              </InputGroup>
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
