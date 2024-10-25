import React from "react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";

export default function SupportDialog({ onCancel, ...props }) {
  return (
    <Dialog {...props} title="Support">
      <div>
        <p>Need to report a problem?</p>
        <p>
          You can file a{" "}
          <a href="https://github.com/Hubs-Foundation/Spoke/issues/new" target="_blank" rel="noopener noreferrer">
            GitHub Issue
          </a>
        </p>
        <p>
          You can also find us on{" "}
          <a href="https://discord.gg/wHmY4nd" target="_blank" rel="noopener noreferrer">
            Discord
          </a>
        </p>
      </div>
    </Dialog>
  );
}
SupportDialog.propTypes = {
  onCancel: PropTypes.func
};
