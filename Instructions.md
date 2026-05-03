
# Instructions

# Summary/Steps
Yep — this one wants a Node + Express + MongoDB + Mongoose API, with most state data coming from statesData.json and only the funfacts living in MongoDB. It also wants the /states/ route family, verifyStates middleware, query-param handling for contig, and POST/PATCH/DELETE support for state fun facts. The assignment PDF and notes also explicitly call for a GitHub repo, deployment, a catch-all 404, and automated testing.


## Best setup path now
### Use:
VS Code
Node.js
Git
GitHub
MongoDB Atlas for the database
Render for hosting

## What you are building
A REST API with:

`GET /states/`

`GET /states/?contig=true`

`GET /states/?contig=false`

`GET /states/:state`

`GET /states/:state/funfact`

`GET /states/:state/capital`

`GET /states/:state/nickname`

`GET /states/:state/population`

`GET /states/:state/admission`

`POST /states/:state/funfact`

`PATCH /states/:state/funfact`

`DELETE /states/:state/funfact`

## Recommended build order
The assignment wants statesData.json used directly for the main state data, while MongoDB stores only documents like { stateCode, funfacts }.

Do it in this order:

* Install Node
* Create project folder
* Initialize npm
* Install Express, Mongoose, dotenv, cors
* Add the supplied statesData.json
* Build the Mongoose model
* Build middleware
* Build the easiest GET routes first
* Build /states/:state/funfact
* Build POST/PATCH/DELETE
* Add root HTML and catch-all 404
* Test in Postman
* Push to GitHub
* Create MongoDB Atlas database
* Deploy to Render
* Add DATABASE_URI in Render env vars
* Re-test public URL

1) Install prerequisites
Install:

Node.js LTS
Git if needed
optionally Postman

Check:
node -v
npm -v
git --version

2) Create the project
mkdir states-api
cd states-api
npm init -y
npm install express mongoose dotenv cors
npm install --save-dev nodemon

3) Create this folder structure
```
states-api/
  .env
  .gitignore
  package.json
  server.js
  data/
    statesData.json
  model/
    States.js
  middleware/
    verifyStates.js
  controllers/
    statesController.js
  routes/
    api/
      states.js
  views/
    index.html
    404.html
```

4) Update package.json
Use this:
``` 
{

  "name": "states-api",
  "version": "1.0.0",
  "description": "INF653 States API",
  "main": "server.js",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  },

  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "mongoose": "^8.13.2"
  },

  "devDependencies": {
    "nodemon": "^3.1.9"
  }
}
```

5) Create .gitignore
node_modules
.env
The instructor notes explicitly say not to commit .env.

6) Create .env
The notes specify dotenv, require('dotenv').config(), and DATABASE_URI=....

PORT=3500

DATABASE_URI=your_mongodb_atlas_connection_string_here

7) Add statesData.json
Put the provided Blackboard file into:

data/statesData.json

Do not put all state data into MongoDB; only funfacts go there.

8) Create the Mongoose model: model/States.js
The schema must have:

stateCode: string, required, unique
funfacts: array of strings

That is directly in the assignment.
```
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const statesSchema = new Schema({
  stateCode: {
    type: String,
    required: true,
    unique: true
  },
  funfacts: {
    type: [String],
    default: []
  }
})

module.exports = mongoose.model('State', statesSchema)
```

9) Create middleware/verifyStates.js
The notes strongly suggest middleware that:

accepts lower/mixed case input
uppercases it
validates against state codes from statesData.json
attaches verified code to req
returns the appropriate invalid-state response otherwise
```
const statesData = require('../data/statesData.json')
const stateCodes = statesData.map(state => state.code)
const verifyStates = (req, res, next) => {
  const stateParam = req.params.state?.toUpperCase()
  if (!stateCodes.includes(stateParam)) {
    return res.status(400).json({ message: 'Invalid state abbreviation parameter' })
  }
  req.code = stateParam
  next()
}

module.exports = verifyStates
```

10) Create the controller: controllers/statesController.js
This is the core file.
```
const State = require('../model/States')
const statesData = require('../data/statesData.json')
const mergeFunFacts = async (stateObj) => {
  const stateFunFacts = await State.findOne({ stateCode: stateObj.code }).lean()
  if (stateFunFacts?.funfacts?.length) {
    return { ...stateObj, funfacts: stateFunFacts.funfacts }
  }
  return stateObj
}

const getAllStates = async (req, res) => {
  let filteredStates = [...statesData]
  if (req.query.contig === 'true') {
    filteredStates = filteredStates.filter(state => !['AK', 'HI'].includes(state.code))
  } else if (req.query.contig === 'false') {
    filteredStates = filteredStates.filter(state => ['AK', 'HI'].includes(state.code))
  }
  const merged = await Promise.all(filteredStates.map(mergeFunFacts))
  res.json(merged)
}

const getState = async (req, res) => {
  const state = statesData.find(s => s.code === req.code)
  const merged = await mergeFunFacts(state)
  res.json(merged)
}

const getFunFact = async (req, res) => {
  const state = await State.findOne({ stateCode: req.code }).lean()
  if (!state?.funfacts?.length) {
    const stateName = statesData.find(s => s.code === req.code).state
    return res.status(404).json({ message: `No Fun Facts found for ${stateName}` })
  }
  const randomIndex = Math.floor(Math.random() * state.funfacts.length)
  res.json({ funfact: state.funfacts[randomIndex] })
}

const getCapital = (req, res) => {
  const state = statesData.find(s => s.code === req.code)
  res.json({ state: state.state, capital: state.capital_city })
}
const getNickname = (req, res) => {
  const state = statesData.find(s => s.code === req.code)
  res.json({ state: state.state, nickname: state.nickname })
}

const getPopulation = (req, res) => {
  const state = statesData.find(s => s.code === req.code)
  res.json({ state: state.state, population: state.population.toLocaleString() })
}

const getAdmission = (req, res) => {
  const state = statesData.find(s => s.code === req.code)
  res.json({ state: state.state, admitted: state.admission_date })
}

const createFunFacts = async (req, res) => {
  const { funfacts } = req.body
  if (!funfacts) {
    return res.status(400).json({ message: 'State fun facts value required' })
  }
  if (!Array.isArray(funfacts)) {
    return res.status(400).json({ message: 'State fun facts value must be an array' })
  }
  let stateDoc = await State.findOne({ stateCode: req.code })
  if (!stateDoc) {
    stateDoc = await State.create({
      stateCode: req.code,
      funfacts
    })
  } else {
    stateDoc.funfacts = [...stateDoc.funfacts, ...funfacts]
    await stateDoc.save()
  }
  res.json(stateDoc)
}

const updateFunFact = async (req, res) => {
  const { index, funfact } = req.body
  if (!index) {
    return res.status(400).json({ message: 'State fun fact index value required' })
  }
  if (!funfact) {
    return res.status(400).json({ message: 'State fun fact value required' })
  }
  const stateDoc = await State.findOne({ stateCode: req.code })
  if (!stateDoc?.funfacts?.length) {
    const stateName = statesData.find(s => s.code === req.code).state
    return res.status(404).json({ message: `No Fun Facts found for ${stateName}` })
  }

  const arrayIndex = Number(index) - 1
  if (arrayIndex < 0 || arrayIndex >= stateDoc.funfacts.length) {
    return res.status(400).json({ message: `No Fun Fact found at that index for ${statesData.find(s => s.code === req.code).state}` })
  }
  stateDoc.funfacts[arrayIndex] = funfact
  await stateDoc.save()
  res.json(stateDoc)
}

const deleteFunFact = async (req, res) => {
  const { index } = req.body
  if (!index) {
    return res.status(400).json({ message: 'State fun fact index value required' })
  }
  const stateDoc = await State.findOne({ stateCode: req.code })
  if (!stateDoc?.funfacts?.length) {
    const stateName = statesData.find(s => s.code === req.code).state
    return res.status(404).json({ message: `No Fun Facts found for ${stateName}` })
  }

  const arrayIndex = Number(index) - 1
  if (arrayIndex < 0 || arrayIndex >= stateDoc.funfacts.length) {
    return res.status(400).json({ message: `No Fun Fact found at that index for ${statesData.find(s => s.code === req.code).state}` })
  }

  stateDoc.funfacts = stateDoc.funfacts.filter((_, i) => i !== arrayIndex
  await stateDoc.save()
  res.json(stateDoc)
}

module.exports = {
  getAllStates,
  getState,
  getFunFact,
  getCapital,
  getNickname,
  getPopulation,
  getAdmission,
  createFunFacts,
  updateFunFact,
  deleteFunFact
}
```
That matches the assignment’s route behaviors, query/body parameter distinctions, and the 1-based indexing requirement for PATCH/DELETE.

11) Create routes: routes/api/states.js
```
const express = require('express')
const router = express.Router()
const statesController = require('../../controllers/statesController')
const verifyStates = require('../../middleware/verifyStates')
router.route('/')
  .get(statesController.getAllStates)
router.route('/:state')
  .get(verifyStates, statesController.getState)
router.route('/:state/funfact')
  .get(verifyStates, statesController.getFunFact)
  .post(verifyStates, statesController.createFunFacts)
  .patch(verifyStates, statesController.updateFunFact)
  .delete(verifyStates, statesController.deleteFunFact)
router.route('/:state/capital')
  .get(verifyStates, statesController.getCapital)
router.route('/:state/nickname')
  .get(verifyStates, statesController.getNickname)
router.route('/:state/population')
  .get(verifyStates, statesController.getPopulation)
router.route('/:state/admission')
  .get(verifyStates, statesController.getAdmission)
module.exports = router
```

12) Create root page: views/index.html
The assignment wants a public HTML page at the root URL.
```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>US States API</title>
</head>
<body>
  <h1>US States API</h1>
  <p>Welcome to the INF653 States API project.</p>
  <p>Use <code>/states</code> to access the API.</p>
</body>
</html>
```

13) Create 404 page: views/404.html
```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>404 Not Found</title>
</head>
<body>
  <h1>404 Not Found</h1>
</body>
</html>
```

14) Create server.js
```
require('dotenv').config()
const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const cors = require('cors')
const app = express()
const PORT = process.env.PORT || 3500
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use('/', express.static(path.join(__dirname, '/views')))
app.use('/states', require('./routes/api/states'))
app.all('*', (req, res) => {
  res.status(404)
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', '404.html'))
  } else if (req.accepts('json')) {
    res.json({ error: '404 Not Found' })
  } else {
    res.type('txt').send('404 Not Found')
  }
})

mongoose.connect(process.env.DATABASE_URI)
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB')
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})
```

This matches the dotenv usage the notes mention and the catch-all behavior the PDF requires.

15) Seed your required fun facts
You need at least 3 fun facts each for:

Kansas
Missouri
Oklahoma
Nebraska
Colorado

And do not add them yet for:

New Hampshire
Rhode Island
Georgia
Arizona
Montana

You can seed them manually with Postman using POST /states/KS/funfact, etc.

Example body:
```
{
  "funfacts": [
    "Kansas contains the geographic center of the contiguous United States.",
    "The state song is 'Home on the Range.'",
    "Wichita is known as the Air Capital of the World."
  ]
}
```

16) Run locally
npm run dev

Test:

http://localhost:3500/
http://localhost:3500/states
http://localhost:3500/states?contig=true
http://localhost:3500/states/KS
http://localhost:3500/states/KS/funfact
http://localhost:3500/states/KS/capital

17) Create MongoDB Atlas database
MongoDB Atlas still offers a free cluster and documents it as free forever for learning/exploration. (MongoDB)

Do this:

Create Atlas account
Create free cluster
Create database user
Add your IP address
Get connection string
Put it in .env as DATABASE_URI

The instructor’s markdown gives the same general DATABASE_URI pattern.

18) Push to GitHub
```
git init
git add .
git commit -m "Initial states API"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/states-api.git
git push -u origin main
```

19) Deploy to Render

In Render:
New Web Service
Connect GitHub repo
Build command: npm install
Start command: npm start
Add env var:
DATABASE_URI=...
optionally PORT=10000 is not needed; Render sets port automatically
Deploy

20) What to prioritize for automated tests
The notes already hint at the best order:

First get /states/ returning raw JSON from statesData.json

Then do the simple endpoints:

/capital
/nickname
/population
/admission

Then do verifyStates

Then do /states/:state

Then /states/:state/funfact

Then POST/PATCH/DELETE

Then finish merged funfacts on /states/

That is the fastest “pass tests early” order from the instructor notes.

Next move should be: create the folder structure, paste the files above, and get /states working locally before touching MongoDB.



## dotenv Environment Variable - Step-by-Step

1) You have to install the dotenv npm package. On a command line, type:

``` 
npm i dotenv 
```

That should install the dotenv package. Now the dependencies in your package.json file should list dotenv similar to this:

``` 
"dotenv": "^16.0.0",
 ```

2) At the top of your server.js file, you need to require the package and call config() like this:

``` 
require('dotenv').config(); 
```

3) Create a .env file in your root directory (the same place you have your server.js file). Inside the .env file, create your environment variable like this:

``` 
DATABASE_URI=mongodb+srv://YOUR_MONGO_USERNAME:YOUR_MONGO_PASSWORD@cluster0.9elkk.mongodb.net/states?retryWrites=true&w=majority 
```

Note: your MongoDB cluster details in the string could easily be different. Get this string from your MongoDB collection like the videos show how to do. No quotes around this value.

4) In your connectDB function, refer to the environment variable like this:

``` 
await mongoose.connect(process.env.DATABASE_URI); 
```

You could name your function differently but I'm giving examples directly from the assigned videos and the source code provided with them.


## Discussion / Suggestions

### Automated Tests

https://dazzling-snickerdoodle-777101.netlify.app/

### Example API

Coming soon - my example was hosted on Glitch.com and I need to relaunch it. I will get this going ASAP!

The Example Code from the Tutorial Videos

All of the example code is available from the Node.js / Express / MongoDB tutorials. 

It is important to understand it, but also, you can use it! 

You will need to understand it to know what to modify for this project. 

Creating a MongoDB collection

This is well-documented in the assigned videos for class. Nothing new here. 

### Middleware

You will need to verify the URL parameter :state for most endpoints. 

It is best to just write the code for this once and include the middleware where needed. 

Permit lowercase, uppercase, and mixed versions of the state abbreviations to be accepted for the :state parameter. 

To create an array that only contains the 50 state abbreviation codes from the state.json data, you may find the array map method useful. 

You may also discover the array find method is useful afterwards.

Respond appropriately to an invalid state abbreviation code (see example project)

If the state code is valid, attach the value to the request object before calling next() because you will need to refer to it in the controller functions, too.

### Strategies for each GET method API endpoint

#### The /states/ endpoint:

Start by just returning the data from the statesData.json file. This will help you pass some of the automated tests quickly. 

The remainder of the requirements for this endpoint actually make it one of the most difficult, so you may want to come back to it AFTER finishing the other GET endpoints. 

To determine the list of states you are going to respond with, it will either be 1) all 2) contiguous or 3) non-contiguous. 

Contiguous means the lower 48 and not HI and AK. Non-contiguous is the opposite. 

This endpoint should acknowledge a query parameter named contig if it is sent. Otherwise, all states data will be sent in the response.

The array methods find, filter, and forEach may be useful as you build the controller function to handle this endpoint.

To deliver ALL of the required data, you will need to query your MongoDB model and attach the "funfacts" to the response for each state that has fun facts saved for it in the MongoDB collection.

#### The /states/:state endpoint:

You will need to find the requested state in the statesData.json data and also attach the "funfacts" from MongoDB if they exist before sending the response.

#### The /states/:state/funfact endpoint:

You are once again finding the specified state, but now you must respond with one random fun fact if it exists or the appropriate message (see example app) if no fun facts exist.

Do you know how to select a random element from an array? You will need to.

#### The capital, nickname, population, and admission endpoints:

These are all nearly identical and the easiest endpoints to complete. 

You are finding the specified state from the states.json data and creating a response with the state name and capital, nickname, population, or admission date. 

There is no interaction with the MongoDB model in these endpoints.

#### The /states/:state/funfact POST request

The request body should have a "funfacts" property with a value that is an array containing one or more fun facts about the state. 

You will want to verify you have received this "funfacts" data. 

You should also verify this data is provided as an array.

You will need to find the requested state in your MongoDB collection. 

If the state already has some fun facts, you should add the new fun facts to them without deleting the pre-existing fun facts. 

If the state has no pre-existing fun facts, then create a new record in your MongoDB collection with the stateCode and funfacts array.

#### The /states/:state/funfact PATCH request

We are not replacing the entire record. Therefore, we use PATCH instead of PUT.

The request body should have a "funfact" property with a value that is a fun fact about the state and there should also be an "index" property (starting at 1, not zero) that indicates the element of the funfacts array to be updated in the funfacts array stored in the MongoDB collection. 

After checking to see if the index value exists, you will want to subtract 1 from the value to match up with the zero index of the array in MongoDB. Why? Zero is equal to false. My suggestion may be easier or you may do it a different way.

Respond appropriately (see example project) if the index or funfact values are not received.

You will need to find the specified state in your MongoDB collection. 

If no fun facts are found or no fun fact is found at the specified element position, send an appropriate response (see example project). 

Otherwise, set the element at the specified position of the funfacts array to the new value. 

Save the record and respond with the result received from the model.

#### The /states/:state/funfact DELETE request

This request body should have an "index" property. Handle it as described above in the PATCH request suggestions. 

Again, appropriate responses as noted in the PATCH request, too. 

You may find filtering an element from an existing array to be the best approach here. You do not want to simply delete an element and leave an undefined value in the array. 

Afterwards, save the record and respond with the result received from the model.


## Express JS Parameters

In the requirements document, I highlight the differences in URL and Query parameters (see Notes #5 under GET requests in that doc). 

There are 3 types of parameters that you can look for: 

1) body - sent in the body of a request (GET requests do not do this - this is usually how POST, PUT, PATCH, and DELETE send params) 

2) URL - defined in the request URL like this - url.com/:param - (Any type of request can use these. It is a dynamic URL) 

3) query - added at the end of the URL like this - url.com?param=Socks (Usually GET requests) 

Express retrieves each of these types differently from the request object (shown as req below): 

1) Any parameter sent in the body of a request: req.body.param_name

2) url.com/:state - req.params.state 

3) url.com/?whatever - req.query.whatever 

You can also retrieve these with object destructing: const { param_name } = req.query (or req.params or req.body) if you wish.

Express Request docs: https://expressjs.com/en/5x/api.html#req 


## verifyStates Middleware
If you are going to need the same function to verify data for more than one route, you should create that function as middleware. This will allow you to create it only once and place it in any route that needs it.

There was an assigned video tutorial on middleware. The middleware I suggest you need for your final project is verifyStates. You need to verify the URL parameter :state matches one of the 50 possible state abbreviations. 

Start by breaking down any problem like this into smaller steps:

1) You will need to pull in the state codes from the statesData.json file.

2) Instead of all of the states data, just make a states code array - I recommend using the array map() method to do this.

3) Search your newly created states code array to see if the state parameter received is in there.

4) If it isn't, return the appropriate response

5) If it is, attach the verified code to the request object: req.code = stateCode and call next() to move on.

You should see examples of the request object as referenced above and calling next() in middleware from the assigned middleware tutorial video.

P.S. - Notice all of the state codes in the statesData.json file are capitalized. You want to be able to receive lowercase and mixed-case parameters. I suggest using the .toUpperCase() string method when receiving the parameter value.