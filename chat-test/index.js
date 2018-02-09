//var app = require('express')();
//var request = require('request');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var port = 3000;
//need this so that all data can be sent to db correctly
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));

var conString = "mongodb://chenchat:VAKGwo9UuAhre2Ue@cluster0-shard-00-00-1ynwh.mongodb.net:27017,cluster0-shard-00-01-1ynwh.mongodb.net:27017,cluster0-shard-00-02-1ynwh.mongodb.net:27017/userData?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin"

//comment/uncomment to show mongoose debug info (everything inserted into db) in the console
mongoose.set("debug", true);

//not sure if we need this
mongoose.Promise = Promise;

/*set up schema in mongoose(will want to add other
data in messages and also probably another schema)*/
var messageSchema = new mongoose.Schema({
    message: String
}, {collection: "messages"});

//turn schema into a model (might wanna figure out why we have to do this)
var Message = mongoose.model("Message", messageSchema);

//connect to db
mongoose.connect(conString, function(err){
    if (err) throw err;
    console.log ("Successfully connected to MongoDB");
    console.log(mongoose.connection.host);
    console.log(mongoose.connection.port);
});

//var myJSONObject = { "id_token":id_token };
//request({
//    url: "http://localhost:3001/post",
//    method: "POST",
//    headers: {
//        "content-type": "application/json",
//        },
//    json: true,   // <--Very important!!!
//    body: myJSONObject
//}, function (error, response, body){
//    console.log(response);
//});

//runs when page is loaded
app.get("/", function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.post('/', function(req, res){
    
    console.log('POST /');
    console.dir(req.body);

    console.log('parameters are: ');
    console.log(req.body.result.parameters);
    handleMessage(req.body);
    // sends a response header to the request
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('Thanks');
});

function handleMessage(data) {

  var result = data.result;
  var action = result.action;
  var parameters = result.parameters;
  var msg = '';

  // TODO: Use the parameters as needed

  if (action === 'sendHelp') {
    var contact = parameters.contact;
    var state = parameters.state;
    var urgency = parameters.urgency;
    msg += 'User needs help now!';
  }
  else if (action === 'switchMode') {
    var mode = parameters.mode;
    var contact = parameters.contact;
    msg += 'User needs you to help him switch modes!';
  }
  // default handler
  else {
    msg += 'User wants to know if everything is okay on your end';
  }
  console.log('I am now sending the message!');
  sendMessage(msg);
}

function sendMessage(msg) {
  
  console.log('message: ' + msg);
  //send data to database
  var m = new Message({'message': msg});
  m.save(function(err) {
      if (err) {
          console.log(err);
          res.status(400).send("Bad Request");
      }
      else {
          console.log('successfully posted to db');
      }
  });
  io.emit('chat message', msg);
}




//send from client to server
io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    console.log('name: ' + msg.name);
    //send data to database
    var m = new Message({'message': msg.message});
    m.save(function(err) {
        if (err) {
            console.log(err);
            res.status(400).send("Bad Request");
        }
        else {
            console.log('successfully posted to db');
        }
    });
  });
  socket.on('chat message', function(msg){
    io.emit('chat message', msg.message);
  });
  socket.on('id token', function(id_token) {
    //console.log('id_token: ' + id_token);
  });
  socket.on('id token', function(id_token) {
    //console.log('id_token: ' + id_token);
  });
});

//listen to the server
http.listen(port, function(){
  console.log('listening on port ' + port);
});
