require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const userRoute = require("./src/routes/user.route");
const eventRoute = require("./src/routes/event.route");
const dashboardRoute = require("./src/routes/dashboard.route")
const cors = require("cors");

const app = express();
const port = 4050;

app.use(cors());
app.use(express.json());
app.use("/api/v1/users", userRoute);
app.use("/api/v1/events", eventRoute);
app.use("/api/v1/dashboard", dashboardRoute);

app.get("/", (req, res) => {
  res.send("Hello Boogle!");
});

const start = async () => {
  try {
    const res = await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
