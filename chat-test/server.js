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
mongoose.set("debug", true);

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

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var userChatRooms = [];

function renderChatSelect(res) {
  //console.log("AFTER GET CHATS FOR USER");
  res.render(__dirname + '/chatSelect.html', { myChatRooms: userChatRooms });
}

app.get("/chatSelect", function(req, res){
  let myChatRooms = [];
  res.render(__dirname + '/chatSelect.html', { myChatRooms: userChatRooms });
});

app.get("/help", function(req, res) {
  res.sendFile(__dirname + '/help.html');
});

app.get("/chat", function(req, res) {

  let result_array1 = [];
  let ChatRoom2 = mongoose.model("ChatRoom", chatRoomSchema);

  //console.log("FINDING NEW CHAT ROOM");
  ChatRoom2.findOne( { 'chat_name': chatName }, 'messages members', function(err, doc) {
    result_array1 = doc;
    let messagesArray = [];
    let membersArray = [];

    //console.log("result array: " + result_array1);
    if(!(result_array1.messages == null)) {
      messagesArray = result_array1.messages;
    }
    if(!(result_array1.members == null)) {
      membersArray = result_array1.members;
    }
    res.render(__dirname + '/chat.html', { messages: messagesArray, members: membersArray });
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
  let message = handleMessage(req.body);
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

function handleMessage(data) {
  let result = data.queryResult;
  let action = result.action;
  let parameters = result.parameters;
  let chatRoom = parameters.chatroom;
  let msg = '';

  console.log("Action is " + action);
  console.log("Chat room is " + chatRoom);

  if (action === 'sendHelp') {
    let state = parameters.state;
    let location = parameters.location;
    msg += 'I need help now. My location is: ' + location + '.';
  }
  else if (action === 'switchMode') {
    let mode = parameters.mode;
    msg += 'I need help ' + mode + '!';
  }
  else if (action === 'reportState') {
    let state = parameters.state;
    msg += 'I ' + state + '!';
  }
  else if (action === 'whereIsMy') {
    let object = parameters.object;
    msg += 'Where is my ' + object + '?';
  }
  else if (action === 'sendCustomMessage') {
    msg += parameters.customMessage;
  }
  else if (action === 'changeChatRoom') {
    console.log("Switching chat rooms");
    // var chatRoom = jsonMessage.queryResult.parameters.chatroom;
    io.emit('getChatRoomFromGoogleApi', chatRoom);
    console.log("After emitting the chatroom");
    return "Changed to room " + chatRoom;
  }
  // default handler
  else {
    msg += 'I am trying to communicate with you but something went wrong!';
  }

  return msg;
}

var sub;
//message collection
var m;
var chatName;

function sendMessage(msg, sender, chat_token = 'test') {
  //check if chat room already exists
  ChatRoomCollection.findOne({ chat_name: chat_token }, function (err, doc) {
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
    //console.log(users);
  });

  socket.on('signing out', function(username) {
    delete sign_ins[username];
  });

  socket.on('check login', function(username) {
    let response;
    if(username in sign_ins) {
      response = "yes";
    }
    else {
      response = "no";
    }
  });
  var callback;

  socket.on('chat name', function(data) {
    chatName = data.chatName;
    let currentEmail = data.email;
    //console.log("chat name " + chatName);
    //console.log("current email: " + currentEmail);

    let destination = '/chat?chatSelect=' + chatName;
    callback = function() {
      //console.log("EMITTING SOCKET REDIRECT");
      io.emit('redirect', destination);
    }
    io.emit('go to chat', destination);
  });

  io.emit('getChatName', chatName);

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

  socket.on('get user chats', function(data) {
      //console.log("EMAIL IS: " + data);
      let results = [];
      helper.userCol.findOne({ 'email': data }, "chats", function (err, doc) {
        if(!(doc.chats == null)) {
          //console.log("User's chats are: " + doc.chats.length);

          for (let i = 0; i < doc.chats.length; i++) {
            results.push(doc.chats[i]);
          }
          socket.emit('receive user chats', results);
        }
        else {
          socket.emit('receive user chats', results);
        }

      });
  });

  socket.on('get email', function(data) {
    helper.userCol.findOne({"fullName": data.username}, "email", function(err, result) {
      socket.emit('set email', {email:result.email, memberArray:data.memberArray});
    });
  });

  socket.on('chatroom delete user', function(data) {
    ChatRoomCollection.updateOne({'chat_name': data.chat_name}, { $pull: { members: { $in: [ data.emailAddress ] } } }, function(err, res) {
      if (err) throw err;
    });

    helper.userCol.updateOne({'email': data.emailAddress}, { $pull: { chats: { $in: [ data.chat_name ] }} }, function(err, res) {
      if (err) throw err;
    });

    socket.emit('deleted user', { email_to_delete:data.emailAddress, chat_name:data.chat_name });
  });

  socket.on('creator check', function(data) {
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
    let newChatName = data.chatName;
    let conditions = { chat_name: newChatName };
    let options = { upsert: true };
    let currentEmail = data.currentEmail;
    
    
        //check if chat exists
    ChatRoomCollection.findOne({ 'chat_name': newChatName }, function(err, doc) {
      if (err) {
        console.log(err);
      }
      // if the chat doesn't exist, user can create it
      else if (doc === null) {
        //console.log("chat doesn't exist");
            // currentEmail will be empty if user is adding members to chat room from chat page
        if (currentEmail != '') {
          //add current user if not already in
          ChatRoomCollection.update(conditions, { $addToSet: { members: currentEmail, creator: data.creator } }, options, callback);

          // add chat to current user's chat array
          helper.updateUserChatsArray(newChatName, currentEmail);
        }
        destination = '/chat?chatSelect=' + newChatName;
        
        io.emit('redirect', destination);
        //io.emit('go to chat', destination);        
      }
      //if does exist, check if user is in it
      else {
        //console.log("chat does exist");
        helper.userCol.findOne({ 'email': currentEmail }, 'chats', function(err, doc) {
          if(!(doc.chats === null)) {
            chatsArr = doc.chats;
          }
          //if chatName is in the user's chat array, good to go
          if (chatsArr.indexOf(newChatName) !== -1) {
            destination = '/chat?chatSelect=' + newChatName;
            callback = function() {
              io.emit('redirect', destination);
            }
            io.emit('redirect', destination);
            io.emit('go to chat', destination);
          }
          //if user is not authorized, don't proceed and send message to client to show error
          else {
            console.log("current user not in existing chat");
            io.emit('user not authorized');
          }
        });
      }
    });

    let validAddrs = true;
    for (let i = 0; i < emailArr.length; i++) {
      if (emailArr[i] !== "" && !(validator.validate(emailArr[i]))) {
        console.log("invalid email address");
        validAddrs = false;
        io.emit('invalid email address');
      }
    }
    
    if (validAddrs) {
      console.log('email address is valid');
      //add all emails if they don't exist
      for (let i = 0; i < emailArr.length; i++) {
        if (emailArr[i] !== "" && validator.validate(emailArr[i])) {
          ChatRoomCollection.update(conditions, { $addToSet: { members: emailArr[i] } }, options, callback);
          //add chat to each user's chat array
          helper.updateUserChatsArray(newChatName, emailArr[i]);
          helper.addUsersWithEmail(newChatName, emailArr[i]);
        }
      }
      //send invites
      if (emailArr.length > 0) {
        helper.sendInvite(emailArr, newChatName, data.creator);
      }
    }
  });

  socket.on('id token', function(id_token) {
    let destination = '/chatSelect?name=';
    client.verifyIdToken(
      id_token,      "533576696991-or04363ojdojrnule3qicgqmm7vmcahf.apps.googleusercontent.com",
      function(e, login) {
        let payload = login.getPayload();
        let userid = payload.sub;
        let name = payload.name;
      }
    );
    username = helper.getName(id_token);
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
