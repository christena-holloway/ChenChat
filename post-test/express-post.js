const express = require('express')
const bodyParser = require('body-parser')

// Create a new instance of express
const app = express()

// Tell express to use the body-parser middleware and to not parse extended bodies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Route that receives a POST request to /post
app.post('/post', function (req, res) {
  const body = req.body
  res.set('Content-Type', 'application/json')
  console.log(body)
})


// Tell our app to listen on port 3001
app.listen(3001, function (err) {
  if (err) {
    throw err
  }

  console.log('Server started on port 3001')
})
