var socket = io();
var chat_name;
var is_creator = "false";
var urlString = window.location.href;
var url = new URL(urlString);
var username = url.searchParams.get("name");

socket.on('creator check receive', function(response) {
  is_creator = response;
  if(is_creator == "true") {
    console.log("YES, IT IS I WHO MADE IT");
  }
});

socket.on('login response', function(response) {
  if (response == "no") {
    window.location.href = '/';
  }
});


/*TODO: FIXXXXXXXXX!*/
$(function () {
  socket.on('getMembers', function(memberArr) {
    console.log("
    for (var i = 0; i < memberArr.length; i++) {
      $('#members').append(memberArr[i]);
    }
  });
});
//good for rest

function updateScroll() {
  var messageBox = document.getElementById("messages");
  $("#messages").scrollTop(999999);
}

function signOut() {
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

function goBack() {
  window.location.href = '/chatroom?name=' + username;
}

function doCheck() {
  var txtboxFilled = true;
  $('#m').each(function () {
    if ($(this).val() != '') {
      txtboxFilled = true;
      return false;
    }
    else {
      txtboxFilled = false;
    }
  });
  $('#send-button').prop('disabled', !txtboxFilled);
}

socket.on('getChatRoomFromGoogleApi', function(chatRoom) {
      if (username == null) {
        window.location.href = "/";
      }
      else {
        console.log('Redirecting  to chat room page');
        window.location.href = '/chatroom?chatroom=' + chatRoom + '&name=' + username;
      }
    });

$(function () {
  var now = moment();
  var time = now.format('YYYY-MM-DD hh:mm A');
  $('form').submit(function() {
      socket.emit('chat message', { msg: $('#m').val(), timestamp: time, chat_token: chat_name, sent_name: username });
      $('#m').val('');
    return false;
  });
  socket.on('chat message', function(data) {
    var sender = data.from;
    var msg = data.message;
    var chatRoomName = data.chatRoomName;
    if (chat_name == chatRoomName) {
      var listElt = $('<li>').text(sender + ": " + msg);
      listElt = listElt.append($('<br>'));
      var whole = listElt.append($('<small>').text(time));
      $('#messages').append(whole);
      updateScroll();
    }
  });
});

$(document).ready(function () {
  $('#m').keyup(doCheck).focusout(doCheck);
});
