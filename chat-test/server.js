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
//need this so that all data can be sent to db correctly
/*
var session = require('express-session');
var cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(session({
  key: 'user_sid',
  secret: 'secretkey',
  resave: false,
  saveUninitialized: true,
  cookie: {},
  user_name: ''
}));

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
};*/


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));

app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');
    }
    next();
});

//Authentication code
var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth;
var client = new auth.OAuth2("533576696991-or04363ojdojrnule3qicgqmm7vmcahf.apps.googleusercontent.com", '', '');
//End

var conString = "mongodb://chenchat:VAKGwo9UuAhre2Ue@cluster0-shard-00-00-1ynwh.mongodb.net:27017,cluster0-shard-00-01-1ynwh.mongodb.net:27017,cluster0-shard-00-02-1ynwh.mongodb.net:27017/userData?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin"

//comment/uncomment to show mongoose debug info (everything inserted into db) in the console
mongoose.set("debug", true);

//not sure if we need this
mongoose.Promise = Promise;

/*set up schema in mongoose(will want to add other
data in messages and also probably another schema)*/
var messageSchema = new mongoose.Schema({
    sender: String,
    message: String
}, {collection: "messages"});

//turn schema into a model (might wanna figure out why we have to do this)
var Message = mongoose.model("Message", messageSchema);

//connect to db
mongoose.connect(conString, { useMongoClient: true }, function(err){
    if (err) throw err;
    console.log ("Successfully connected to MongoDB");
    console.log(mongoose.connection.host);
    console.log(mongoose.connection.port);
});

//runs when page is loaded
app.get("/", function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get("/chat", function(req, res) {
  res.sendFile(__dirname + '/chat.html');
});

app.get("/contacts", function(req, res) {
  res.sendFile(__dirname + '/contacts.html');
});

app.post('/chat', function(req, res){

    console.log('POST /');
    console.dir(req.body);
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

function handleMessage(data) {

  var result = data.queryResult;
  var action = result.action;
  var parameters = result.parameters;
  var msg = '';

  // TODO: Use the parameters as needed

  if (action === 'sendHelp') {
    var contact = parameters.contact;
    var state = parameters.state;
    var urgency = parameters.urgency;
    msg += 'I need help now -- ' + urgency;
  }
  else if (action === 'switchMode') {
    var mode = parameters.mode;
    var contact = parameters.contact;
    msg += 'I need you to help me switch modes to ' + mode + '!';
  }
  // default handler
  else {
    msg += 'Is everything okay on your end?';
  }
  console.log('I am now sending the message!');
  sendMessage(msg);
}

var sub;

function sendMessage(msg) {
  // TODO: add recipient's user id to db
  console.log('user id: ' + sub);
  console.log('message: ' + msg);

  //send data to database
  var m = new Message({'sender': sub, 'message': msg });
  m.save(function(err) {
      if (err) {
          console.log(err);
          res.status(400).send("Bad Request");
      }
      else {
          console.log('successfully posted to db');
      }
  });

  var User = mongoose.model("User", userSchema);
  var username;
  // find each person with a last name matching 'Ghost', selecting the `name` and `occupation` fields
  User.findOne({ 'userID': sub }, 'fullName', function (err, user) {
    if (err) {
      console.log(err);
      res.status(400).send("Bad Request");
    }
    console.log('%s corresponds to %s.', user.userID, user.fullName);
    username = user.fullName;
    io.emit('chat message', (username + ': ' + msg));
  });

}

//send from client to server
io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('chat message', function(msg){
    console.log('msg: ' + msg);
    //console.log('message: ' + msg.message);
    //console.log('name: ' + msg.name);
    //send data to database
    sendMessage(msg);
  });

  socket.on('id token', function(id_token) {
    var destination = '/chat';
    io.emit('redirect', destination);
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
    sendUserInfo(id_token);
    //console.log('id_token: ' + id_token);
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

var userSchema = new mongoose.Schema({
  userID: String,
  fullName: String
}, {collection: "users"});

var User = mongoose.model("User", userSchema);
function sendUserInfo(token,req) {
  sub = getUID(token);
  var name = getName(token);
  User.count({ userID: sub }, function(err, count) {
    if (count === 0) {
      var u = new User({ 'userID': sub, 'fullName': name });
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
