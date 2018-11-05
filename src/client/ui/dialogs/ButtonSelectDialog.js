import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import classNames from "classnames";
import Button from "../Button";
import Header from "../Header";
export default class ButtonSelectDialog extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.any.isRequired
      })
    ),
    okLabel: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
    cancelLabel: PropTypes.string,
    onCancel: PropTypes.func
  };

  static defaultProps = {
    okLabel: "OK",
    cancelLabel: "Cancel"
  };

  constructor(props) {
    super(props);
  }

  render = () => {
    return (
      <div className={styles.dialogContainer}>
        <Header title={this.props.title} />
        <div className={styles.content}>
          <div className={styles.contentRows}>
            <p>{this.props.message}</p>
            <div className={styles.buttonList}>
              {this.props.options.map(v => (
                <Button key={v.value} onClick={() => this.props.onSelect(v.value)}>
                  {v.iconClassName && (
                    <i style={{ paddingRight: "5px" }} className={classNames("fas", v.iconClassName)} />
                  )}
                  {v.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.bottom}>
          <Button key="cancel" onClick={this.props.onCancel}>
            {this.props.cancelLabel}
          </Button>
        </div>
      </div>
    );
  };
}
