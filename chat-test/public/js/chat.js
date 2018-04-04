var socket = io();

socket.on('login response', function(response) {
  if (response == "no") {
    window.location.href = '/';
  }
});

$(function () {
  socket.on('getMembers', function(memberArr) {
    for (var i = 0; i < memberArr.length; i++) {
      $('#members').append(memberArr[i]);
    }
  });
});

function updateScroll() {
  //var chatWindow = document.getElementsByClassName("chat-content")[0];
  //chatWindow.scrollTop = 999999;
  var messageBox = document.getElementById("messages");
  //messageBox.scrollTop = 999999;
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

$(document).ready(function () {
  $('#m').keyup(doCheck).focusout(doCheck);
});