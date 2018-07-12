import React from "react";
import styles from "./SnackBar.scss";

export default function SnackBar() {
  return (
    <div className={styles.bar}>
      <div className={styles.icon}>
        <image src="" />
      </div>
      <div className={styles.content}>Content</div>
      <div className={styles.options}>Options</div>
    </div>
  );
}
