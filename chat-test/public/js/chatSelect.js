var urlString = window.location.href;
var url = new URL(urlString);
var username = url.searchParams.get("name");

function chatRedirect() {
  // var input_vals = $(this).serialize();
  if (username == null) {
    window.location.href = "/";
  }
  else {

    var inChatName = document.getElementById("chat_id").value;
    if(inChatName == "") {
       var x = document.getElementsByClassName("blank-error");
       x[0].style.display = "inline";
    }
    else {
      //var emails = document.getElementById("chat_mems").value;

      var emailNames = document.getElementById("chat_mems").value;
      console.log("emails in chatSelect" + emailNames);

      //console.log("VALUE IN: " + inChatName);
      let socket = io();
      socket.emit('chat name', inChatName);
      socket.emit('entered emails', {emails: emailNames, creator:username});
      //window.location.replace("/chat");//+ input_vals[0];
      socket.on('redirect', function(destination) {
        window.location.href = destination + "&name=" + username;
      });
    }
  }
}

function goToChatRoom(chatName) {
  if (username == null) {
    window.location.href = "/";
  }
  else {
    let socket = io();
    socket.emit('chat name', chatName);
    socket.on('redirect', function(destination) {
      window.location.href = destination + "&name=" + username;
    });
  }
}

function signOut() {
  //socket.emit("signing out", username);
  let auth2 = gapi.auth2.getAuthInstance();
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

$(".my-chat-room").click(function() {
  var room = $(".my-chat-room").text();
  goToChatRoom(room);
});
