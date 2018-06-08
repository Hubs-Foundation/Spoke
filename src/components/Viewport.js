import React from "react";
import styles from "./Viewport.scss";

export default React.forwardRef((props, ref) => <canvas className={styles.viewport} ref={ref} tabIndex="-1" />);
