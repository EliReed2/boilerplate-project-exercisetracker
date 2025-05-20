const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

//Mongoose Schemas/config
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO)
  .then(() => console.log('Connected to MONGO'));

//Define the user schema
const userSchema = new mongoose.Schema({
  username: {
    required: true,
    type: String,
  },
  log: [
    {
      description: {type: String, required: true},
      date: {type: Date, required: true},
      duration: {type: Number, required: true},

    }
  ],
  logCount: {
    type: Number,
    required: true,
  }
});

//Pull model from schema
const User = mongoose.model('User', userSchema);

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Creates a new user in the user schema
app.post('/api/users', async (req, res) => {
  try {
    //May have to alter this line
    const username = req.body.username;
    //Ensure username has been given
    if (!username) {
      return res.status(400).json({error: "Username was not provided"});
    }
    //Make a new user model
    const newUser = new User({ 
      username: username,
      log: [],
      logCount: 0,
     });
    //Attempt to pull newUser
    const createdUser = await newUser.save();
    //Pull info from newUser 
    const response = {
      username: createdUser.username,
      _id: createdUser._id,
    };
    //return response
    return res.json(response);
  } catch (error) {
    //Return error
    console.error("Error in POST /api/users:", error);
    return res.status(500).json({error: "Server Encountered an error | Post new user route"});
  }
});

//Add an exercise to a users log
app.post('/api/users/:_id/exercises', async (req,res) => {
  try {
    //Get id from params
    const userId = req.params._id;
    const { description, duration, date } = req.body;

    //Ensure duration and userId provided
    if (!userId || !duration || !description) {
      return res.status(400).json({error: "One of needed parameters not provided"});
    }
    //Get duration as a number 
    const numericalDuration = parseInt(duration);
    //Set date to current if date not specified
    const solidDate = date ? new Date(date) : new Date();
    //Attempt to find user with given id
    const user = await User.findById(userId);
    //Ensure user was found
    if (!user) {
      return res.status(404).json({error: "User not found"});
    };
    //Add new log to user and increment log count
    const newLog = {
      description: description,
      date: solidDate,
      duration: numericalDuration,
    };
    user.log.push(newLog);
    user.logCount = user.log.length;

    //Await saving user
    await user.save();

    const response = {
      _id: user._id,
      username: user.username,
      date: newLog.date.toDateString(),
      duration: newLog.duration,
      description: newLog.description,
    };

    return res.json(response);
  } catch (error) {
    return res.status(500).json({error: "Server encountered an error on updating log/adding exercise"});
  }
});

//Returns a list of all users
app.get('/api/users', async(req, res) => {
  try {
    //Try to save ALL users
    const allUsers = await User.find();
    return res.json(allUsers);
  } catch (error) {
    return res.status(500).json({error: "Server encountered error: Get all users route"});
  }
});

//GET request, retrieves users full exercise log
app.get('/api/users/:_id/logs', async (req,res) => {
  try {
    //Get id from params
    const userId = req.params._id;
    //Optional search constraints
    const {from, to, limit} = req.query;

    //Retrieve user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({error: "User could not be found"});
    };
    //Filter logs if neccesary
    let filterLogs = user.log;

    if (from) {
      const fromDate = new Date(from);
      filterLogs = filterLogs.filter(log => log.date >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      filterLogs = filterLogs.filter(log => log.date >= toDate);
    }
    if (limit) {
      filterLogs = filterLogs.slice(0, parseInt(limit));
    }

    // Format log dates to readable strings
    const formattedLogs = filteredLogs.map(log => ({
      description: log.description,
      duration: log.duration,
      date: log.date.toDateString(),
    }));

    const response = {
      _id: user._id,
      username: user.username,
      count: formattedLogs.length,
      log: formattedLogs,
    };
    //Get and return user logs
    return res.json(response);
  } catch (error) {
    return res.status(500).json({error: "Server encountered error: Get all users logs route"});
   
  }
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
