import express from "express";
import bodyParser from "body-parser";
import identifyRoute from "./routes/identify";

const app = express();
app.use(bodyParser.json());

app.use("/identify", identifyRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
