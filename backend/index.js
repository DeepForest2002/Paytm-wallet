const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
const mainRouter = require("./routes/routes_index");
app.use(express.json());
app.use(cors());

app.use("/api/v1", mainRouter);
app.listen(port, () => {
  console.log("port number is ", port);
});
