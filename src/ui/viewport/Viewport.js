import React from "react";
import styles from "./Viewport.scss";

const Viewport = React.forwardRef((props, ref) => <canvas className={styles.viewport} ref={ref} tabIndex="-1" />);

Viewport.displayName = "Viewport";

export default Viewport;
