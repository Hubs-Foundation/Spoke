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
    let message = e.message;

    if (url.indexOf("sketchfab.com") >= 0) {
      message =
        "Error adding model.\n\nNote: Sketchfab models must be marked as 'Downloadable' to be added to your scene.\n\nError: " +
        e.message;
    } else if (url.indexOf("poly.google.com") >= 0) {
      message =
        "Error adding model.\n\nNote: Poly panoramas are not supported and 3D models must be GLTF 2.0.\n\nError: " +
        e.message;
    }

    showDialog(ErrorDialog, {
      title: "Add Model",
      message: message
    });
  }
}
