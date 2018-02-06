var app = require('express')();
var request = require('request');
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

//var myJSONObject = { "test":"message" };
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


io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
  });
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
