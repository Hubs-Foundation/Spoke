import React, { Component } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";

const DialogContext = React.createContext({
  component: null,
  props: {},
  showDialog: () => {},
  hideDialog: () => {}
});

export class DialogContextProvider extends Component {
  static propTypes = {
    children: PropTypes.node
  };

  showDialog = (component, props = {}) => {
    this.setState({
      component,
      props
    });
  };

  hideDialog = () => {
    this.setState({
      component: null,
      props: {}
    });
  };

  state = {
    component: null,
    props: {},
    showDialog: this.showDialog,
    hideDialog: this.hideDialog
  };

  render() {
    const { component: DialogComponent, props, hideDialog: onClose } = this.state;

    return (
      <DialogContext.Provider value={this.state}>
        {this.props.children}
        <Modal
          ariaHideApp={false}
          isOpen={!!DialogComponent}
          onRequestClose={this.hideDialog}
          shouldCloseOnOverlayClick={true}
          className="Modal"
          overlayClassName="Overlay"
        >
          {DialogComponent && <DialogComponent {...props} onClose={onClose} />}
        </Modal>
      </DialogContext.Provider>
    );
  }
}

export function withDialog(WrappedComponent) {
  return function DialogContextComponent(props) {
    return (
      <DialogContext.Consumer>
        {({ showDialog, hideDialog }) => (
          <WrappedComponent {...props} showDialog={showDialog} hideDialog={hideDialog} />
        )}
      </DialogContext.Consumer>
    );
  };
}
