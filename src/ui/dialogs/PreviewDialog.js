import React from "react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";
import styled from "styled-components";

const LeftContent = styled.div`
  display: flex;
  width: 360px;
  border-top-left-radius: inherit;
  align-items: center;
  padding: 30px;

  img {
    border-radius: 6px;
  }
`;

const RightContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 30px 30px;
`;

export default function PreviewDialog({ imageSrc, children, ...props }) {
  return (
    <Dialog {...props}>
      <LeftContent>
        <img src={imageSrc} />
      </LeftContent>
      <RightContent>{children}</RightContent>
    </Dialog>
  );
}

PreviewDialog.propTypes = {
  imageSrc: PropTypes.string,
  children: PropTypes.node
};
