const http = require("./app");
const port = 4000;

http.listen(port, () => {
  console.log("Server is up on port " + port);
});
