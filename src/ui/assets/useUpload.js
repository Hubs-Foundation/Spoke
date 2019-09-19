import { useCallback, useContext } from "react";
import ErrorDialog from "../dialogs/ErrorDialog";
import ProgressDialog from "../dialogs/ProgressDialog";
import { DialogContext } from "../contexts/DialogContext";

export default function useUpload(source) {
  const { showDialog, hideDialog } = useContext(DialogContext);

  const onUpload = useCallback(
    async files => {
      const abortController = new AbortController();

      showDialog(ProgressDialog, {
        title: "Uploading Files",
        message: `Uploading files 1 of ${files.length}: 0%`,
        cancelable: true,
        onCancel: () => {
          abortController.abort();
          hideDialog();
        }
      });

      try {
        await source.upload(
          files,
          (item, total, progress) => {
            showDialog(ProgressDialog, {
              title: "Uploading Files",
              message: `Uploading files: ${item} of ${total}: ${Math.round(progress * 100)}%`,
              cancelable: true,
              onCancel: () => {
                abortController.abort();
                hideDialog();
              }
            });
          },
          abortController.signal
        );

        hideDialog();
      } catch (error) {
        console.error(error);
        showDialog(ErrorDialog, {
          title: "Upload Error",
          message: `Error uploading file: ${error.message || "There was an unknown error."}`,
          error
        });
      }
    },
    [showDialog, hideDialog, source]
  );

  return onUpload;
}
