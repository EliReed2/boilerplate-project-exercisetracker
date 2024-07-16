const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
//Mongoose connection and schema creation
mongoose.connect(process.env.URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    required: false,
    default: 0,
  },
  log: [
    {
      description: String,
      duration: Number,
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const User = mongoose.model("User", userSchema);
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
//Shows all users and their usernames + ids
app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  await addUserToDatabase(username);
  const addedUser = await User.findOne({ username: username });
  res.json({ username: addedUser.username, _id: addedUser.id });
});
//When the exercise form is completed this post request saves the data and adds it to the exercises log while also printing the data through a json res
app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.body[":_id"];
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date
    ? new Date(req.body.date).toDateString()
    : new Date(Date.now()).toDateString();
  if (await checkDatabaseForId(id)) {
    await populateUsersLog(id, description, duration, date);
    const updatedObject = await User.findById(id);
    res.json({
      username: updatedObject.username,
      description: description,
      duration: duration,
      date: date,
      _id: id,
    });
  } else {
    res.json({ message: "No User By That Id" });
  }
});
//Returns all the users of the program
app.get("/api/users", async (req, res) => {
  const allUsers = await User.find();
  let usersArray = allUsers.map(({ username, _id }) => ({ username, _id }));
  res.json(usersArray);
});

//GET request that returns all the exercise logs from a given user
app.get("/api/users/:_id/logs?", async (req, res) => {
  id = req.params._id;
  if (checkDatabaseForId(id)) {
    const selectedUser = await User.findById(id);
    let logs = selectedUser.log;
    if (logs) {
      //Finding param values
      const { from, to, limit } = req.query;
      //Filtering the log array
      if (from || to) {
        const fromDate = from ? new Date(from) : new Date(0);
        const toDate = to ? new Date(to) : new Date();
        logs = logs.filter((log) => {
          const logDate = new Date(log.date);
          return logDate >= fromDate && logDate <= toDate;
        });
      }
      //Filtering for limits if any are added
      if (limit) {
        logs = logs.slice(0, limit);
      }
    }
    res.json({
      _id: selectedUser.id,
      username: selectedUser.username,
      count: selectedUser.count,
      log: logs,
    });
  } else {
    res.json({ Error: "No User with that Id!" });
  }
});
//Adds user to mongoose database
const addUserToDatabase = async (username) => {
  let newUser = new User({
    username: username,
  });
  await newUser.save();
};

//Adds data from post request to users exercise log
const populateUsersLog = async (id, description, duration, date) => {
  try {
    const userToPopulate = await User.findById(id);
    const logObject = {
      description: description,
      duration: duration,
      date: date,
    };
    userToPopulate.log.push(logObject);
    userToPopulate.count += 1;
    await userToPopulate.save();
  } catch (err) {
    console.error("Error while populating user");
    throw err;
  }
};
//Searches database and returns true if a user by that id exists
const checkDatabaseForId = async (id) => {
  try {
    const foundUser = await User.findById(id);
    return !!foundUser;
  } catch (err) {
    return false;
  }
};
const listener = app.listen(process.env.PORT || 3001, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
