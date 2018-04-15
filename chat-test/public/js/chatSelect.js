var urlString = window.location.href;
var url = new URL(urlString);
var username = url.searchParams.get("name");

var currentUserEmail;

var socket = io();

socket.on('set email', function(data) {
  currentUserEmail = data.email;
  console.log('GETTING CHATS');
  socket.emit('get user chats', currentUserEmail);

});

function chatRedirect() {
  // var input_vals = $(this).serialize();
  if (username == null) {
    window.location.href = "/";
  }
  else {

  
  socket.on('user not authorized', function() {
    //let x = document.getElementsByClassName("not-authorized");
    //x[0].style.display = "inline";
    alert("You are not authorized to access this group");
  });
  
  
    var inChatName = document.getElementById("chat_id").value;
    if(inChatName == "") {
       //var x = document.getElementsByClassName("blank-error");
       //x[0].style.display = "inline";
       alert("Group name is required");
    }
    else {
      //var emails = document.getElementById("chat_mems").value;

      var emailNames = document.getElementById("chat_mems").value;
      console.log("emails in chatSelect" + emailNames);

      /*let auth2 = gapi.auth2.getAuthInstance();
    let profile = auth2.currentUser.get().getBasicProfile();
    let currentEmail = profile.getEmail();
    fetchAsync()
      .then(data => {
        currentEmail = data.emailAddress;
        console.log("CURRENT EMAIL: " + currentEmail);
      }
      )
      .catch(reason => console.log(reason.message))*/


      //let socket = io();
      socket.emit('chat name', { email: currentUserEmail, chatName: inChatName});
      socket.emit('entered emails', {emails: emailNames, creator:username, currentEmail: currentUserEmail});
      //window.location.replace("/chat");//+ input_vals[0];
      socket.on('redirect', function(destination) {
        window.location.href = destination + "&name=" + username;
      });
    }
  }
}

function goToChatRoom(chatName) {
  console.log("HERE");
  if (username == null) {
    window.location.href = "/";
  }
  else {
    console.log("About to redirect to chat page");

      /*let auth2 = gapi.auth2.getAuthInstance();

    let profile = auth2.currentUser.get().getBasicProfile();
    let currentEmail = profile.getEmail();
    fetchAsync()
      .then(data => {
        currentEmail = data.emailAddress;
        console.log("CURRENT EMAIL: " + currentEmail);
      }
      )
      .catch(reason => console.log(reason.message))*/


    //let socket = io();
    socket.emit('chat name', { email: currentUserEmail, chatName: chatName});
    socket.on('go to chat', function(destination) {
      console.log("Destination is " + destination);
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
    gapi.auth2.init({
      client_id: '533576696991-or04363ojdojrnule3qicgqmm7vmcahf',
    });
  });
}

function helppg() {
  window.location.href = '/help';
}

async function fetchAsync () {
  // await response of fetch call
  let response = await fetch('https://www.googleapis.com/plus/v1/people/me');
  // only proceed once promise is resolved
  let data = await response.json();
  // only proceed once second promise is resolved
  return data;
}

$(document).ready(function () {
  socket.on('receive user chats', function(chatRoomsWithPermission) {
    console.log("User's chat rooms include: " + chatRoomsWithPermission);
    let templist = [];
    let rowin = -1;
    let listElt = [];
    chatRoomsWithPermission.sort();
    for (let i = 0; i < chatRoomsWithPermission.length; i++) {
      if (Math.floor(i/5) != rowin) {
        listElt = $('<ul id=row' + rowin + ' class=row' + rowin + '>');
      }
      listElt=listElt.append($('<button type="button" id="my-chat-room">').text(chatRoomsWithPermission[i]));
      rowin = Math.floor(i/5);
      $(".my-chatrooms").append(listElt);
    }
  });

  console.log("Welcome to the chat select page");
  $("body").on("click", "#my-chat-room", function() {
    var room = $(this).text();
    console.log("GO TO CHATROOM: " + room);
    goToChatRoom(room);
  });


});
