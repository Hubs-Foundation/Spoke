import React, { Component } from "react";
import ImageInput from "./ImageInput";
import ImagesLibrary from "../library/ImagesLibrary";
import { withEditor } from "../contexts/EditorContext";
import { withApi } from "../contexts/ApiContext";
import PropTypes from "prop-types";

class TextureInput extends Component {
  static propTypes = {
    value: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    editor: PropTypes.object.isRequired,
    api: PropTypes.object.isRequired
  };

  onChange = async src => {
    const { accessibleUrl } = await this.props.api.resolveMedia(src);
    const texture = await this.props.editor.textureCache.get(accessibleUrl);
    this.props.onChange(texture);
  };

  render() {
    const { onChange, value, ...rest } = this.props;
    const src = (value && value.image && value.image.src) || "";

    return (
      <ImageInput
        {...rest}
        value={src}
        onChange={this.onChange}
        dialogTitle="Select an Image..."
        component={ImagesLibrary}
      />
    );
  }
}

export default withApi(withEditor(TextureInput));
