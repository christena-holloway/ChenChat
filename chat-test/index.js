var app = require('express')();
var request = require('request');
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var port = 3000;
//need this so that all data can be sent to db correctly
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

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

//send from client to server
io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('chat message', function(msg){
    console.log('message: ' + msg.message);
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
});

//listen to the server
http.listen(port, function(){
  console.log('listening on port ' + port);
});
