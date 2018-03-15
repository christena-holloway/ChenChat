var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var mongoose = require('mongoose');
var jwtDecode = require('jwt-decode');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var port = process.env.PORT || 3000;
var url = "https://chenchat2.azurewebsites.net";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

//Authentication code
var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth;
var client = new auth.OAuth2("533576696991-or04363ojdojrnule3qicgqmm7vmcahf.apps.googleusercontent.com", '', '');
//End

var currentChatroom;

var conString = "mongodb://chenchat:VAKGwo9UuAhre2Ue@cluster0-shard-00-00-1ynwh.mongodb.net:27017,cluster0-shard-00-01-1ynwh.mongodb.net:27017,cluster0-shard-00-02-1ynwh.mongodb.net:27017/userData?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin"

//comment/uncomment to show mongoose debug info (everything inserted into db) in the console
mongoose.set("debug", true);

//not sure if we need this
mongoose.Promise = Promise;

//define message and user schemas
var messageSchema = new mongoose.Schema({
    chat_name: String,
    members: [],
    messages: []
}, {collection: "messages"});

var userSchema = new mongoose.Schema({
  userID: String,
  fullName: String,
  email: String
}, {collection: "users"});

var Message = mongoose.model("Message", messageSchema);

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


app.get("/chat", function(req, res) {
  var results = queryMessages(chatName);
  console.log(results);
  //queryUsers(results);
  res.render(__dirname + '/chat.html', { testVar: chatName});
});

app.get('/contacts', function(req, res) {
  res.sendFile(__dirname + '/contacts.html');
});

app.get('/signup', function(req, res) {
  res.sendFile(__dirname + '/signup.html');
});

app.post('/', function(req, res) {
  console.log('POST to /');
  console.log(req.body);
  console.log('action is ' + req.body.queryResult.action);

  var action = req.body.queryResult.action;
  if(action == 'changeChatRoom') {
    // send POST req to /chatroom
    console.log("Switching chat rooms");
    transferPostRequest(req.body, 'chatroom');
  }
  else {
    // send POST req to /chat
    console.log("Sending message to /chat page");
    transferPostRequest(req.body, 'chat');
  }

  // sends a response header to the request
  res.writeHead(200, {'Content-Type': 'application/json'});
  // send a response in the format required by Dialogflow
  let responseToAssistant = {
    fulfillmentText: 'Your request is being fulfilled by ChenChat!' // displayed response
  };
  res.end(JSON.stringify(responseToAssistant));

})

app.post('/chatroom', function(req, res) {
  console.log('POST to /chatroom');
  console.log(req.body);

  var chatRoom = req.body.queryResult.parameters.chatRoom;
  console.log("Chat room is " + chatRoom);

  changeChatRoom(chatRoom);
  // sends a response header to the request
  res.writeHead(200, {'Content-Type': 'application/json'});
  // send a response in the format required by Dialogflow
  let responseToAssistant = {
    fulfillmentText: 'Your request to change chat rooms is being handled!' // displayed response
  };
  res.end(JSON.stringify(responseToAssistant));

});

app.post('/chat', function(req, res) {

    console.log('POST /chat');
    console.log(req.body);
    console.log('parameters are: ');
    console.log(req.body.queryResult.parameters);

    handleMessage(req.body);
    // sends a response header to the request
    res.writeHead(200, {'Content-Type': 'application/json'});
    // send a response in the format required by Dialogflow
    let responseToAssistant = {
      fulfillmentText: 'Your message is being delivered by ChenChat!' // displayed response
    };
    res.end(JSON.stringify(responseToAssistant));
});

function transferPostRequest(data, path) {
  var request = require('request');
  var urlPath = 'https://chenchat2.azurewebsites.net/' + path;
  var options = {
    uri: urlPath,
    port: 80,
    method: 'POST',
    json: true,
    body: data,
    headers: {
      'Accept': 'application/json',
      'Accept-Charset': 'utf-8',
    }
  };

  // Send POST request
  var status = request.post(options, function (error, response, body) {
    if (error) {
      console.error('Failed to transfer request to /' + path + '. Error:', error);
      return false;
    }
    console.log('Successfully transferred the request to /' + path + '. Server responded with:', body);
    return true;
  })

  return status;
}

function changeChatRoom(chatRoom) {

  // TODO: Use JS to set form values and to click submit button!
  console.log("Redirecting to a different chat room!");
  window.location.href = '/chatroom';
  document.getElementById("chat_id").value = chatRoom;
  // document.getElementById("selectRoom").click();
}

// To handle sending a message in the chat
function handleMessage(data) {

  var result = data.queryResult;
  var action = result.action;
  var parameters = result.parameters;
  var msg = '';

  if (action === 'sendHelp') {
    var contact = parameters.contact;
    var state = parameters.state;
    var urgency = parameters.urgency;
    msg += 'I need help ' + urgency + '.';
  }
  else if (action === 'switchMode') {
    var mode = parameters.mode;
    var contact = parameters.contact;
    msg += contact + ', I need help ' + mode + '!';
  }
  else if (action === 'reportState') {
    var state = parameters.state;
    msg += 'I ' + state + '!';
  }
  else if (action === 'whereIsMy') {
    var object = parameters.object;
    msg += 'Where is my ' + object + '?';
  }
  // default handler
  else {
    msg += 'I am trying to communicate with you but something went wrong!';
  }
  console.log('I am now sending the message!');
  sendMessage(msg, 'Chun-Han');
}

var sub;

var dict = {};

//message collection
var m;

var chatName;

function sendMessage(msg, temp, chat_token = 'test') {
  // TODO: add recipient's user id to db

  //check if chat room already exists
  Message.count({ chat_name: chatName }, function (err, count) {
    console.log("counting");
    //if this chat room does not exist yet, create it
    if (count === 0) {
      console.log("creating new chat room");
      m = new Message({ 'chat_name': chatName, 'members': [], 'messages': [] });
      var msgObj = {'from': sub, 'body': msg};
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
    }
    else {
      Message.findOne({ chat_name: chatName }, function (err, doc) {
        //doc is document for the chat room
        m = doc;
        var msgObj = {'from': sub, 'body': msg};
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
    }
  });

  var User = mongoose.model("User", userSchema);
  var username;

  User.findOne({ 'userID': sub }, 'userID fullName', function (err, user) {
    if (err) {
      console.log(err);
      res.status(400).send("Bad Request");
    }

    console.log("ID is: " + user.fullName);
  });
  console.log("variable is " + temp);
  io.emit(chat_token, (temp + ': ' + msg));
}

function queryMessages(roomName) {
  var result_array1 = [];
  var Message2 = mongoose.model("Message", messageSchema);
  /*
  Message2.findOne({ 'chat_name': roomName }, 'messages', function (err, result) {
    if (err) {
      console.log(err);
      res.status(400).send("Bad Request");
    }
    if (result != null) {
      console.log(message.messages.body);
    }

  });
  */
  console.log("this is the room name: " + roomName);

  var query = Message2.findOne({ 'chat_name': roomName });

  // selecting the `name` and `occupation` fields
  query.select('messages');

  // execute the query at a later time
  query.exec(function (err, result) {
    if (err) return handleError(err);
    // Prints "Space Ghost is a talk show host."
    if (result != null) {
      result.messages.forEach(function(value) {
        result_array1.push(value);
      });
      //result_array1 = result.messages;
      //console.log(result_array1);
      //result_array1.save();

      //console.log(id_array);
      console.log(result);
      return result.messages;
    }

  });


}

function queryUsers(results) {
  var id_array = [];
  console.log(results);
  results.forEach(function(value) {
    id_array.push(value.from);
  });
  var User = mongoose.model("User", userSchema);
  var query = User.findOne({ 'userID': id_array});
  query.select('fullName');
  query.exec(function (err, users) {
    if (err) return handleError(err);
    console.log(users);
  });
}

var users = {};
var keys = {};
var chat_names = {};
var chat_keys = {};
//send from client to server
var username;
var temp_variable;
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

  socket.on('chat name', function(inChatName) {
    chatName = inChatName;
    //chat_names[chatName] = socket.id; //NEW LINE
    //chat_keys[socket.id] = chatName; //NEW LINE
    console.log("chat name " + chatName);
    var destination = '/chat';
    io.emit('redirect', destination);
  });

  io.emit('getChatName', chatName);

  socket.on('chat message', function(data){
    var msg = data.msg;
    var chat_token = data.chat_token;
    console.log('msg: ' + msg);
    console.log("token is: " + chat_token)
    //console.log('token is: ' + socket.handshake.query.token);
    console.log("socket is " + socket.id);
    if(socket.id in keys && keys[socket.id] in users) {
      sendMessage(msg, keys[socket.id], chat_token);
      //sendMessage(msg, keys[socket.id]);
    }
    else {
      console.log("not logged in");
    }
  });

  socket.on('id token', function(id_token) {
    var destination = '/chatroom';

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

    username = getName(id_token);
    io.emit('redirect', destination);
    sendUserInfo(id_token);
  });
});

function getUID(id_token) {
  var decoded = jwtDecode(id_token);
  var sub = decoded['sub'];

  return sub;
}

function getName(id_token) {
  var decoded = jwtDecode(id_token);
  var name = decoded['name'];

  return name;
}

function getEmail(id_token) {
    var decoded = jwtDecode(id_token);
    var email = decoded['email'];

    return email;
}

var name;
var email;

var User = mongoose.model("User", userSchema);
function sendUserInfo(token) {
  sub = getUID(token);
  name = getName(token);
  email = getEmail(token);

  User.count({ userID: sub }, function(err, count) {
    if (count === 0) {
      var u = new User({ 'userID': sub, 'fullName': name, 'email': email });
      u.save(function(err) {
        if (err) {
          console.log(err);
          res.status(400).send("Bad Request");
        }
        else {
          console.log("successfully posted user info to db");
        }
      })
    }
    else {
      console.log("user is already in db");
    }
  });
}

//listen to the server
http.listen(port, function(){
  console.log('listening on port ' + port);
});
