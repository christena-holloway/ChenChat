var urlString = window.location.href;
var url = new URL(urlString);
var username = url.searchParams.get("name");
// Check if user is logged in
if (username == null) {
  window.location.href = "/";
}
else {
  // URL contains the name of the chatroom
  if(window.location.href.indexOf("chatroom=") > -1) {
    var chatRoom = url.searchParams.get("chatroom");
    console.log("Chatroom from url param is " + chatRoom);

    window.onload = function() {
      document.getElementById("chat_id").value = chatRoom;
      document.getElementById("selectRoom").click();
    }
  }
}

function chatRedirect() {
  // var input_vals = $(this).serialize();
  if (username == null) {
    window.location.href = "/";
  }
  else {
    var inChatName = document.getElementById("chat_id").value;
    //var emails = document.getElementById("chat_mems").value;

    var emailNames = document.getElementById("chat_mems").value;
    console.log("emails in chatSelect" + emailNames);
    //console.log("VALUE IN: " + inChatName);
    var socket = io();
    socket.emit('chat name', inChatName);
    socket.emit('entered emails', {emails: emailNames, creator:username});
    //window.location.replace("/chat");//+ input_vals[0];
    socket.on('redirect', function(destination) {
      window.location.href = destination + "&name=" + username;
    });
  }
}
function signOut() {
  //socket.emit("signing out", username);
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
    document.location.href = "https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=https://chenchat2.azurewebsites.net";
  });
}
function onLoad() {
  gapi.load('auth2', function() {
    gapi.auth2.init();
  });
}
function helppg() {
  window.location.href = '/help';
}
