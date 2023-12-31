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
  count: Number,
});
const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true },
  dateValue: { type: Date, required: true },
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);
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

app.get("/api/users/:_id/logs/", async (req, res) => {
  const userId = req.params._id;
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;
  if (from && to && limit) {
    const userFound = await User.findById(userId).select(["-__v"]);
    const logsFound = await Exercise.find({ userId: userId })
      .select(["description", "date", "duration", "-_id"])
      .where({ dateValue: { $gte: from, $lte: to } })
      .limit(limit)
      .exec();
    const concat = {
      _id: userFound._id,
      username: userFound.username,
      count: logsFound.length,
      log: logsFound,
    };
    res.json(concat);
  } else {
    const userFound = await User.findById(userId).select(["-__v"]);
    const logsFound = await Exercise.find({ userId: userId })
      .select(["description", "date", "duration", "-_id"])
      .exec();
    const concat = {
      _id: userFound._id,
      username: userFound.username,
      count: logsFound.length,
      log: logsFound,
    };
    res.json(concat);
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  const bodyData = req.body;
  const valueToPush = new Exercise({
    userId: id,
    description: bodyData.description,
    duration: bodyData.duration,
    dateValue: bodyData.date,
    date:
      new Date(bodyData.date).toDateString() != "Invalid Date"
        ? new Date(bodyData.date).toDateString()
        : new Date().toDateString(),
  });
  await valueToPush.save();
  await User.findByIdAndUpdate(id, {
    $inc: { count: 1 },
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
