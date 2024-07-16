const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

mongoose.connect(process.env.URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
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

app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  addUserToDatabase(username);
  const addedUser = await User.findOne({ username: username });
  res.json({ username: addedUser.username, _id: addedUser.id });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.body[":_id"];
  const description = req.body.description;
  const duration = req.body.duration;
  const date = new Date(req.body.date);
  if (await checkDatabaseForId(id)) {
    await populateUsersLog(id, description, duration, date);
    const updatedObject = await User.findById(id);
    res.json({
      _id: id,
      username: updatedObject.username,
      date: date.toUTCString(),
      duration: duration,
      description: description,
    });
  } else {
    res.json({ message: "No User By That Id" });
  }
});
//Returns all the users of the program
app.get("/api/users", async (req, res) => {
  const usersArray = [];
  const allUsers = await User.find();
  res.json({ Users: allUsers });
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
    await userToPopulate.save();
  } catch (err) {
    console.error("Error while populating user");
    throw err;
  }
};
const checkDatabaseForId = async (id) => {
  try {
    const foundUser = await User.findById(id);
    console.log(!!foundUser);
    const find = await User.findOne({ username: "erer" });
    console.log(find.id);
    return !!foundUser;
  } catch (err) {
    return false;
  }
};
const listener = app.listen(process.env.PORT || 3001, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
