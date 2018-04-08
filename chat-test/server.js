var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var validator = require('email-validator');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var port = process.env.PORT || 3000;
var url = "https://chenchat2.azurewebsites.net";

var helper = require('./helper.js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));

app.set('view engine', 'pug');
app.engine('html', require('ejs').renderFile);

//Authentication code
var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth();
var client = new auth.OAuth2("533576696991-or04363ojdojrnule3qicgqmm7vmcahf.apps.googleusercontent.com", '', '');
//End

var conString = "mongodb://chenchat:VAKGwo9UuAhre2Ue@cluster0-shard-00-00-1ynwh.mongodb.net:27017,cluster0-shard-00-01-1ynwh.mongodb.net:27017,cluster0-shard-00-02-1ynwh.mongodb.net:27017/userData?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin";

//comment/uncomment to show mongoose debug info (everything inserted into db) in the console
//mongoose.set("debug", true);

//not sure if we need this
mongoose.Promise = Promise;

//define chatroom and user schemas
var chatRoomSchema = new mongoose.Schema({
    chat_name: String,
    creator: String,
    members: [],
    messages: []
}, {collection: "ChatRoom"});

var ChatRoomCollection = mongoose.model("ChatRoom", chatRoomSchema);
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

app.get("/chatSelect", function(req, res){
  // res.sendFile(__dirname + '/chatroom.html');

  // find all chatrooms for username's email
  let userChatRooms = helper.getChatsForUser(helper.email);
  console.log("Chatrooms for user " + helper.email + " are: " + userChatRooms);

  res.render(__dirname + '/chatSelect.html', { myChatRooms: userChatRooms });
});

app.get("/help", function(req, res) {
  res.sendFile(__dirname + '/help.html');
});

app.get("/chat", function(req, res) {

  let result_array1 = [];
  let ChatRoom2 = mongoose.model("ChatRoom", chatRoomSchema);


  ChatRoom2.findOne( { 'chat_name': chatName }, 'messages members', function(err, doc) {
    result_array1 = doc;
    console.log("result array: " + result_array1);
    res.render(__dirname + '/chat.html', { messages: result_array1.messages, members: result_array1.members });
  });
});

app.post('/', function(req, res) {
  console.log('POST to /');
  console.log(req.body);
});

app.post('/chat', function(req, res) {

  console.log('POST /chat');
  console.log(req.body);
  console.log('parameters are: ');
  console.log(req.body.queryResult.parameters);

  let chatRoom = req.body.queryResult.parameters.chatroom;
  let message = helper.handleMessage(req.body);
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
    let time = helper.getTimestamp();
    let msgObj = {'from': sender, 'body': msg, 'timestamp': time};
    m.messages.push(msgObj);
    m.save(function(err) {
      if (err) {
        console.log(err);
        res.status(400).send("Bad Request");
      }
      else {
        console.log('successfully posted to db');
        //callback();
      }
    });
  });
  // What's this for? (move to helper if still needed)
  /*UserCollection.findOne({ 'userID': sub }, 'fullName', function (err, user) {
    if (err) {
      console.log(err);
      res.status(400).send("Bad Request");
    }
  });*/
  io.emit('chat message', { from: sender, message: msg, chatRoomName: chat_token });
}

var users = {};
var keys = {};
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
  });

  socket.on('signing out', function(username) {
    delete sign_ins[username];
  });

  socket.on('check login', function(username) {
    let response;
    if(username in sign_ins) {
      response = "yes";
      //io.emit('login response', response);
    }
    else {
      response = "no";
      //io.emit('login response', response);
    }
  });
  var callback;

  socket.on('chat name', function(inChatName) {
    chatName = inChatName;
    //console.log("chat name " + chatName);
    let destination = '/chat?chatSelect=' + chatName;
    callback = function() {
      io.emit('redirect', destination);
    }
  });

  io.emit('getChatName', chatName);


  //TODO: query db for all members in chat room
  //io.emit('getMembers', memberArr)

  socket.on('chat message', function(data){
    let msg = data.msg;
    let time = data.timestamp;
    let sent_name = data.sent_name;
    let chat_token = data.chat_token;
    if (sent_name !== null) {
      sendMessage(msg, sent_name, chat_token);
    }
    let currentTime = helper.getTimestamp();
  });


  socket.on('get email', function(data) {
    let local_email = helper.getUserEmail(data);
  });

  socket.on('creator check', function(data) {
    console.log('I AM DOING THE CREATOR CHECK');
    var ChatRoom2 = mongoose.model("ChatRoom", chatRoomSchema);
    var response = "false";
    function callback() {
      socket.emit('creator check receive', response);
    }

    ChatRoom2.findOne( { 'chat_name': data.chatroomName, 'creator': data.user }, 'creator', function(err, doc) {
      if(doc != null ) {
        response = "true";
      }
      callback();
    });
  });

  socket.on('entered emails', function(data) {
    let emails = data.emails;
    let stripped = emails.replace(/\s/g, "");
    let splitArr = stripped.split(',');
    let emailArr = splitArr.filter(item => item.trim() !== '');
    //console.log(emailArr);

    //check if chatroom exists
    ChatRoomCollection.count({ chat_name: chatName }, function (err, count) {
    //if this chat room does not exist yet, create it
      if (count === 0) {
        m = new ChatRoomCollection({ 'chat_name': chatName, 'creator': data.creator, 'members': [], 'messages': [] });
        //!!!!TODO: make sure duplicate email addresses aren't entered
        //push current user to members vector
        //let email = helper.getEmail(token);
        //console.log("current user's email: " + helper.email);
        m.members.push(helper.email);
        //add members
        for (let i = 0; i < emailArr.length; i++) {
          //console.log(emailArr[i]);
          if (emailArr[i] !== "" && validator.validate(emailArr[i])) {
            m.members.push(emailArr[i]);
          }
        }
        //console.log("length of emailArr: " + emailArr.length);
        if (emailArr.length > 0) {
          //console.log("sending invites to: " + emailArr);
          helper.sendInvite(emailArr, chatName, username);
        }
        // add chat to current user's chat array
        //console.log("will add chat to current user's chat array");
        m.save(function(err) {
          if (err) {
            console.log(err);
            res.status(400).send("Bad Request");
          }
          else {
            console.log('successfully posted to db');
            callback();
          }
        });
      }
      else {
        ChatRoomCollection.findOne({ chat_name: chatName }, function (err, doc) {
          //doc is document for the chat room
          m = doc;
          m.members.push(helper.email);
          for (let i = 0; i < emailArr.length; ++i) {
            ChatRoomCollection.count({ chat_name: chatName }, function (err, count) {
              if (count === 0) {
                m.members.push(emailArr[i]);
              }
            });
          }
          //console.log("length of emailArr: " + emailArr.length);
          if (emailArr.length > 0){
            //console.log("sending invites to: " + emailArr);
            helper.sendInvite(emailArr, chatName, username);
          }
          m.save(function(err) {
            if (err) {
              console.log(err);
              res.status(400).send("Bad Request");
            }
            else {
              console.log('successfully posted to db');
              callback();
            }
          });
        });
      }
    });
  });

  socket.on('id token', function(id_token) {
    let destination = '/chatSelect?name=';
    client.verifyIdToken(
      id_token,
      "533576696991-or04363ojdojrnule3qicgqmm7vmcahf.apps.googleusercontent.com",
      function(e, login) {
        let payload = login.getPayload();
        let userid = payload.sub;
        let name = payload.name;
      }
    );
    username = helper.getName(id_token);
    //sign_ins[username] = "logged_in";
    if(!(username in sign_ins)) {
      sign_ins[username] = 0;
    }
    sign_ins[username] = 1;
    io.emit('redirect', destination + username);
    helper.sendUserInfo(id_token);
  });
});

//listen to the server
http.listen(port, function(){
  console.log('listening on port ' + port);
});
