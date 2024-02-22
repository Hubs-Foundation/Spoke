/**
 * belivvr custom
 * 화면공유(칠판) 컴포넌트 추가.
 * 해당 컴포넌트를 추가하면 스포크 에디터에서 화면공유(칠판) 컴포넌트를 사용할 수 있다.
 */
import SharedScreen from "../objects/SharedScreen";
import EditorNodeMixin from "./EditorNodeMixin";

export default class SharedScreenNode extends EditorNodeMixin(SharedScreen) {
    static componentName = "shared-screen";

    static nodeName = "Shared Screen";

    static async deserialize(editor, json) {
        const node = await super.deserialize(editor, json);

        const { color, opacity } = json.components.find(c => c.name === SharedScreenNode.componentName).props;

        node.color = color;
        node.opacity = opacity;

        return node;
    }

    constructor(editor) {
        super(editor);

        this.color = "#31343A";
        this.opacity = 1;
    }

    copy(source, recursive = true) {
        super.copy(source, recursive);

        return this;
    }

    serialize() {
        return super.serialize({
            [SharedScreenNode.componentName]: {
                color: this.color,
                opacity: this.opacity
            }
        });
    }

    prepareForExport() {
        super.prepareForExport();

        this.addGLTFComponent("shared-screen");
    }
}