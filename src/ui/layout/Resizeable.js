import React, { Component, Children, createRef, Fragment } from "react";
import styled, { createGlobalStyle } from "styled-components";
import PropTypes from "prop-types";

const ResizeCursorState = createGlobalStyle`
  body {
    cursor: ${props => (props.resizing ? (props.axis === "y" ? "ns-resize" : "ew-resize") : "inherit")};
  }
`;

const HorizontalContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const HorizontalResizer = styled.div`
  display: flex;
  height: 6px;

  :hover {
    cursor: ns-resize;
  }

  :active,
  :hover {
    background-color: ${props => props.theme.hover};
  }
`;

const VerticalContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
`;

const VerticalResizer = styled.div`
  display: flex;
  width: 6px;

  :hover {
    cursor: ew-resize;
  }

  :hover,
  :active {
    background-color: ${props => props.theme.hover};
  }
`;

const ResizeContainer = styled.div.attrs(props => ({
  style: {
    flex: props.size === undefined ? 1 : props.size
  }
}))`
  display: flex;
  overflow: hidden;
`;

export class Resizeable extends Component {
  static propTypes = {
    children: PropTypes.node,
    initialSizes: PropTypes.arrayOf(PropTypes.number),
    min: PropTypes.number.isRequired,
    axis: PropTypes.string.isRequired,
    onChange: PropTypes.func
  };

  static defaultProps = {
    min: 0.2,
    axis: "y"
  };

  constructor(props) {
    super(props);

    let sizes;

    if (props.initialSizes) {
      sizes = props.initialSizes;
    } else {
      const childCount = Children.count(props.children);
      sizes = [];

      for (let i = 0; i < childCount; i++) {
        sizes.push(1 / childCount);
      }
    }

    this.state = {
      sizes,
      index: null,
      resizing: false
    };

    this.containerRef = createRef();
    this.itemRefs = [];
  }

  onMouseDown = (_e, index) => {
    this.setState({ index, resizing: true });
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("blur", this.onMouseUp);
  };

  onMouseMove = e => {
    const { axis, min } = this.props;
    const { index, sizes } = this.state;
    const containerRect = this.containerRef.current.getBoundingClientRect();
    const itemRect = this.itemRefs[index].getBoundingClientRect();
    const totalRatio = sizes[index] + sizes[index + 1];

    let newRatio;

    if (axis === "y") {
      newRatio = (e.pageY - itemRect.top) / containerRect.height;
    } else {
      newRatio = (e.pageX - itemRect.left) / containerRect.width;
    }

    newRatio = Math.min(Math.max(newRatio, min), totalRatio - min);

    sizes[index] = newRatio;
    sizes[index + 1] = totalRatio - newRatio;

    this.setState({ sizes }, () => {
      if (this.props.onChange) {
        this.props.onChange();
      }
    });
  };

  onMouseUp = () => {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("blur", this.onMouseUp);
    this.setState({ resizing: false });
  };

  componentWillUnmount() {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("blur", this.onMouseUp);
  }

  render() {
    const children = Children.toArray(this.props.children);
    const newChildren = [];

    const Resizer = this.props.axis === "y" ? HorizontalResizer : VerticalResizer;
    const Container = this.props.axis === "y" ? VerticalContainer : HorizontalContainer;

    for (let i = 0; i < children.length; i++) {
      newChildren.push(
        <ResizeContainer ref={ref => (this.itemRefs[i] = ref)} size={this.state.sizes[i]} key={"container-" + i}>
          {children[i]}
        </ResizeContainer>
      );

      if (i < children.length - 1) {
        newChildren.push(<Resizer onMouseDown={e => this.onMouseDown(e, i)} key={"resizer-" + i} />);
      }
    }

    return (
      <Fragment>
        <Container ref={this.containerRef}>{newChildren}</Container>
        <ResizeCursorState resizing={this.state.resizing} axis={this.props.axis} />
      </Fragment>
    );
  }
}
