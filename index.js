require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

const bodyParser = require("body-parser");
const multer = require("multer");
const upload = multer();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URL);

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  log: [{ description: String, duration: Number, date: String, _id: false }],
  count: Number,
});
const exerciseSchema = new Schema(
  {
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: String, required: true },
  },
  { _id: false }
);

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Log", exerciseSchema);
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload.array());
app.use(express.static("public"));

app.post("/api/users", async (req, res) => {
  if (req.body) {
    const createdUser = await User.create({
      username: req.body.username,
      count: 0,
    });
    // console.log(createdUser);
    res.json({ username: createdUser.username, _id: createdUser._id });
  }
});

app.get("/api/users", async (req, res) => {
  const UserList = await User.find().select(["-log", "-count"]).exec();
  res.json(UserList);
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const id = req.params._id;
  const foundUser = await User.findById(id).select(["-__v"]).exec();
  res.json(foundUser);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  const bodyData = req.body;
  const valueToPush = new Exercise({
    description: bodyData.description,
    duration: bodyData.duration,
    date: new Date(bodyData.date).toDateString() || new Date().toDateString(),
  });
  await User.findByIdAndUpdate(id, {
    $push: { log: valueToPush },
  });
  const pushedValue = await User.findById(id);
  res.json({
    _id: id,
    username: pushedValue.username,
    date: valueToPush.date,
    duration: valueToPush.duration,
    description: valueToPush.description,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
