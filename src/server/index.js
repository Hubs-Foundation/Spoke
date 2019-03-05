import { startServer } from "./Server";

startServer().catch(error => {
  console.error(error);
});
