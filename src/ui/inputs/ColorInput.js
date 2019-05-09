import React, { Component } from "react";
import PropTypes from "prop-types";
import { SketchPicker } from "react-color";
import { EditableInput } from "react-color/lib/components/common";
import styles from "./ColorInput.scss";
import THREE from "../../vendor/three";

export default class ColorInput extends Component {
  static propTypes = {
    value: PropTypes.object.isRequired,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      targetBlock: null,
      pickerX: 0,
      pickerBottom: 0,
      displayColorPicker: false
    };
  }

  componentDidMount = () => {
    window.addEventListener("resize", this.updateDimensions);
  };

  componentWillUnmount = () => {
    window.removeEventListener("resize", this.updateDimensions);
  };

  updateDimensions = () => {
    if (!this.state.targetBlock) return;
    const target = this.state.targetBlock.getBoundingClientRect();
    this.setState({
      pickerX: target.left,
      pickerBottom: window.innerHeight - target.y
    });
  };

  handleClick = e => {
    const target = e.currentTarget.getBoundingClientRect();
    this.setState({
      targetBlock: e.currentTarget,
      pickerX: target.left,
      pickerBottom: window.innerHeight - target.y,
      displayColorPicker: !this.state.displayColorPicker
    });
  };

  handleClose = () => {
    this.setState({ displayColorPicker: false });
  };

  onChangeText = value => {
    this.props.onChange(new THREE.Color(value));
  };

  onChangePicker = ({ hex }) => {
    this.props.onChange(new THREE.Color(hex));
  };

  render() {
    const { value, onChange, ...rest } = this.props;

    const hexColor = "#" + value.getHexString();

    return (
      <div className={styles.colorInputContainer}>
        <div className={styles.block} onClick={this.handleClick}>
          <div className={styles.color} style={{ background: hexColor }} />
        </div>
        <div className={styles.colorInput}>
          <EditableInput {...rest} value={hexColor} onChange={this.onChangeText} />
        </div>
        {this.state.displayColorPicker && (
          <div style={{ left: this.state.pickerX, bottom: this.state.pickerBottom }} className={styles.popover}>
            <div className={styles.cover} onClick={this.handleClose} />
            <div className={styles.colorPicker}>
              <SketchPicker {...rest} color={hexColor} disableAlpha={true} onChange={this.onChangePicker} />
            </div>
          </div>
        )}
      </div>
    );
  }
}
