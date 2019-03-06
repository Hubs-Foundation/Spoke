const { startServer } = require("./Server");

startServer().catch(error => {
  console.error(error);
});
