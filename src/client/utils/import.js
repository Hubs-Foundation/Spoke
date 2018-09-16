import ProgressDialog from "../ui/dialogs/ProgressDialog";
import ErrorDialog from "../ui/dialogs/ErrorDialog";

export async function performModelImport(url, editor, showDialog, hideDialog) {
  showDialog(ProgressDialog, {
    title: "Importing Asset",
    message: "Importing asset..."
  });

  try {
    await editor.importGLTFIntoModelNode(url);
    hideDialog();
  } catch (e) {
    showDialog(ErrorDialog, {
      title: "Error adding model.",
      message: e.message
    });
  }
}
