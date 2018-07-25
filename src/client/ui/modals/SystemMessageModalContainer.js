import React, { Component } from "react";
import { withProject } from "../contexts/ProjectContext";

class SystemMessageModalContainer extends Component {
  constructor() {
    super();
  }

  render() {
    return (
      <div className="modalContainer">
        <div className="head">
        </div>
        <div className="content">
        </div>
        <div className="actions">
        </div>
      </div>
    );
  }
}

export default withProject(SystemMessageModalContainer);
