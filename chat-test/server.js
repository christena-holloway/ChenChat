var express = require('express');
var app = express();
//var cors = require('cors');
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var validator = require('email-validator')
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var port = process.env.PORT || 3000;
var url = "https://chenchat2.azurewebsites.net";

var helper = require( './helper.js' );
//var url = "https://localhost:" + port;
//var router = new express.Router();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));

app.set('view engine', 'pug');
app.engine('html', require('ejs').renderFile);

//Authentication code
var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth;
var client = new auth.OAuth2("533576696991-or04363ojdojrnule3qicgqmm7vmcahf.apps.googleusercontent.com", '', '');
//End

var email;

var conString = "mongodb://chenchat:VAKGwo9UuAhre2Ue@cluster0-shard-00-00-1ynwh.mongodb.net:27017,cluster0-shard-00-01-1ynwh.mongodb.net:27017,cluster0-shard-00-02-1ynwh.mongodb.net:27017/userData?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin"

//comment/uncomment to show mongoose debug info (everything inserted into db) in the console
mongoose.set("debug", true);

//not sure if we need this
mongoose.Promise = Promise;

//define chatroom and user schemas
var chatRoomSchema = new mongoose.Schema({
    chat_name: String,
    members: [],
    messages: []
}, {collection: "ChatRoom"});

var userSchema = new mongoose.Schema({
  userID: String,
  fullName: String,
  email: String
}, {collection: "users"});

var ChatRoomCollection = mongoose.model("ChatRoom", chatRoomSchema);
var UserCollection = mongoose.model("User", userSchema);
//connect to db
mongoose.connect(conString, function(err){
    if (err) throw err;
    console.log ("Successfully connected to MongoDB");
    console.log(mongoose.connection.host);
    console.log(mongoose.connection.port);
});

//GET METHODS (so that we don't get "cannot GET" errors
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get("/chatroom", function(req, res){
  res.sendFile(__dirname + '/chatroom.html');
});

app.get("/help", function(req, res) {
  res.sendFile(__dirname + '/help.html');
});

app.get("/chat", function(req, res) {
  var result_array1 = [];
  var ChatRoom2 = mongoose.model("ChatRoom", chatRoomSchema);

  function callback() {
    console.log("members: " + result_array1.members);
    res.render(__dirname + '/chat.html', { messages: result_array1.messages, members: result_array1.members });
  }
  
  ChatRoom2.findOne( { 'chat_name': chatName }, 'messages members', function(err, doc) {
    result_array1 = doc;
    callback();
  })
});

app.post('/', function(req, res) {
  console.log('POST to /');
  console.log(req.body);
})

app.post('/chat', function(req, res) {

  console.log('POST /chat');
  console.log(req.body);
  console.log('parameters are: ');
  console.log(req.body.queryResult.parameters);

  var chatRoom = req.body.queryResult.parameters.chatroom;
  var message = helper.handleMessage(req.body);
  console.log('Sending the message: ' + message);
  sendMessage(message, 'Chun-Han', chatRoom);

  // sends a response header to the request
  res.writeHead(200, {'Content-Type': 'application/json'});
  // send a response in the format required by Dialogflow
  let responseToAssistant = {
    fulfillmentText: 'The message: ' + message + ' is being delivered by ChenChat!' // displayed response
  };
  res.end(JSON.stringify(responseToAssistant));
});

var sub;

//message collection
var m;
var chatName;

function sendMessage(msg, sender, chat_token = 'test') {
  //check if chat room already exists
  ChatRoomCollection.findOne({ chat_name: chatName }, function (err, doc) {
    //doc is document for the chat room
    m = doc;
    var time = helper.getTimestamp();
    var msgObj = {'from': sender, 'body': msg, 'timestamp': time};
    m.messages.push(msgObj);
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

  UserCollection.findOne({ 'userID': sub }, 'fullName', function (err, user) {
    if (err) {
      console.log(err);
      res.status(400).send("Bad Request");
    }
  });

  io.emit('chat message', { from: sender, message: msg, chatRoomName: chat_token });
}

var users = {};
var keys = {};
//send from client to server
var username;
var sign_ins = {};
var total_sign_ins = {};
io.on('connection', function(socket){
  users[username] = socket.id;
  keys[socket.id] = username;
  console.log(username + ' connected with socket id: ' + socket.id);

  socket.on('disconnect', function(){
    console.log(keys[socket.id] + ' disconnected with socket id: ' + socket.id);
    if(socket.id in keys && keys[socket.id] in users) {
      delete users[keys[socket.id]];
      delete keys[socket.id];
    }
    console.log(users);
    //var token = socket.handshake.query.token;
    //console.log("QUERY STRING ON DISCONNECT IS: " + token);
    //delete sign_ins[token];
  });

  socket.on('signing out', function(username) {
    delete sign_ins[username];
  });

  socket.on('check login', function(username) {
    var response;

    if(username in sign_ins) {
      response = "yes";
      //io.emit('login response', response);
    }
    else {
      response = "no";
      //io.emit('login response', response);
    }

    /*
    if(username in sign_ins) {
      if(sign_ins[username] = 1) {
        response = "yes";
        //io.emit('login response', response);
      }
      else {
        response = "no";
        //io.emit('login response', response);
      }
    }
    else {
      response = "no";
      //io.emit('login response', response);
    }
    */
    //io.emit('login response', response);
  });

  socket.on('chat name', function(inChatName) {
    chatName = inChatName;
    console.log("chat name " + chatName);
    var destination = '/chat?chatroom=' + chatName;
    io.emit('redirect', destination);
  });

  io.emit('getChatName', chatName);
  
  
  //TODO: query db for all members in chat room
  //io.emit('getMembers', memberArr)

  socket.on('chat message', function(data){
    var msg = data.msg;
    var time = data.timestamp;
    var sent_name = data.sent_name;
    console.log("sent name: " + sent_name);
    var chat_token = data.chat_token;
    console.log("message and time on server " + msg + ", " + time);
    //console.log('msg: ' + msg);
    //console.log("socket is " + socket.id);
    /*
    if(socket.id in keys && keys[socket.id] in users) {
      sendMessage(msg, keys[socket.id], chat_token);
      //sendMessage(msg, keys[socket.id]);
    }
    else {
      console.log("not logged in");
    }*/
    //sendMessage(msg, keys[socket.id], chat_token);
    // Ensure user is logged in
    if (sent_name != null) {
      sendMessage(msg, sent_name, chat_token);
    }
    var currentTime = helper.getTimestamp();
  });

    socket.on('entered emails', function(emails) {
      var stripped = emails.replace(/\s/g, "");
      var emailArr = stripped.split(',');
      console.log(emailArr);

      //check if chatroom exists
      ChatRoomCollection.count({ chat_name: chatName }, function (err, count) {
      //if this chat room does not exist yet, create it
        if (count === 0) {
          m = new ChatRoomCollection({ 'chat_name': chatName, 'members': [], 'messages': [] });
          //!!!!TODO: make sure duplicate email addresses aren't entered
          //push current user to members vector
          //let email = getEmail(token);
          m.members.push(email);
          //add members
          for (var i = 0; i < emailArr.length; ++i) {
            console.log(emailArr[i]);
            if (emailArr[i] !== "" && validator.validate(emailArr[i])) {
              m.members.push(emailArr[i]);
            }
          }
          helper.sendInvite(emailArr, chatName, username);
          console.log("after new message");

          m.save(function(err) {
            if (err) {
                console.log(err);
                res.status(400).send("Bad Request");
            }
            else {
                console.log('successfully posted to db');
            }
          });
        }
        else {
          ChatRoomCollection.findOne({ chat_name: chatName }, function (err, doc) {
            //doc is document for the chat room
            m = doc;
            for (var i = 0; i < emailArr.length; ++i) {
              ChatRoomCollection.count({ chat_name: chatName }, function (err, count) {
                if (count == 0) {
                  m.members.push(emailArr[i]);
                }
              });
            }

            helper.sendInvite(emailArr, chatName, username);
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
      }
    });
  });

  socket.on('id token', function(id_token) {
    var destination = '/chatroom?name=';

    client.verifyIdToken(
    id_token,
    "533576696991-or04363ojdojrnule3qicgqmm7vmcahf.apps.googleusercontent.com",  // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3],
    function(e, login) {
      var payload = login.getPayload();
      var userid = payload['sub'];
      var name = payload['name'];
      // If request specified a G Suite domain:
      //var domain = payload['hd'];
    });

    username = helper.getName(id_token);
    //sign_ins[username] = "logged_in";
    if(!(username in sign_ins)) {
      sign_ins[username] = 0;
    }
    sign_ins[username] = 1;
    io.emit('redirect', destination + username);
    helper.sendUserInfo(id_token, email, UserCollection);
  });
});

//listen to the server
http.listen(port, function(){
  console.log('listening on port ' + port);
});
