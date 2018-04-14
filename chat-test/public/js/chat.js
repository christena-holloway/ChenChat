var socket = io();

var chat_name;
var is_creator = "false";

var urlString = window.location.href;
var url = new URL(urlString);
var username = url.searchParams.get("name");

var my_email = "";

socket.on('creator check receive', function(response) {
  is_creator = response;
  if(is_creator == "true") {
    console.log("YES, IT IS I WHO MADE IT");
  }
});

var input = document.getElementById("addMembers");


socket.on('login response', function(response) {
  if (response == "no") {
    window.location.href = '/';
  }
});

$(function () {
  socket.on('getMembers', function(memberArr) {
    for (let i = 0; i < memberArr.length; i++) {
      $('#members').append(memberArr[i]);

    }
  });
});

function updateScroll() {
  let messageBox = document.getElementById("messages");
  $("#messages").scrollTop(999999);
}

function signOut() {
  let auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    document.location.href = "https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=https://chenchat2.azurewebsites.net";
  });
}

function openMod() {
  // display text box for email address input
  console.log('openMod');
  window.location.href = '#openModal';
}

function onLoad() {
  gapi.load('auth2', function() {
    gapi.auth2.init();
  });
}

function goBack() {
  window.location.href = '/chatSelect?name=' + username;
}

function doCheck() {
  let txtboxFilled = true;
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
    console.log("Trying to change rooms but use name is null");
    window.location.href = "/";
  }
  else {
    console.log("relocating to new chatroom: " + chatRoom);
    window.location.href = '/chatSelect?chatroom=' + chatRoom + '&name=' + username;
  }
});

$(function () {
  let now = moment();
  let time = now.format('YYYY-MM-DD hh:mm A');
  $('#mememail').submit(function() {
    addNewMembers();
     $(this).closest('form').find("input[type=email], textarea").val("");
    return false;
  });
  $('#flex-msg-form').submit(function() {
      socket.emit('chat message', { msg: $('#m').val(), timestamp: time, chat_token: chat_name, sent_name: username });
      $('#m').val('');
    return false;
  });
  socket.on('chat message', function(data) {
    let sender = data.from;
    let msg = data.message;
    let chatRoomName = data.chatRoomName;
    if (chat_name == chatRoomName) {
      let listElt;
      if(sender == username) {
        listElt = $("<li><span style='float:right'>" + sender + ": " + msg + "</span></li>");
      }
      else {
        listElt = $('<li>').text(sender + ": " + msg);
      }
      //let listElt = $('<li>').text(sender + ": " + msg);
      listElt = listElt.append($('<br>'));
      let whole = listElt.append($('<small>').text(time));
      $('#messages').append(whole);
      updateScroll();
    }
  });
});

$(document).ready(function () {
  $('#m').keyup(doCheck).focusout(doCheck);
});

function deleteUser(emailAddress) {
  if(is_creator === "true") {
    socket.emit('chatroom delete user', {emailAddress:emailAddress, chat_name:chat_name});
    alert(emailAddress.toString() + ', You have been deleted from this chatroom ');
  }
  else {
    alert("You do not have permission to delete users from this chatroom.");
  }
}


socket.on('set email', function(data) {
  my_email = data.email;
  for (i = 0; i < data.memberArray.length; i++) {
      //var listElt = $('<li>').text(memberArray[i]);
      //$('#members').append(listElt);
      var listElt;
      if(is_creator === "true" && my_email != data.memberArray[i]) {
        listElt = $("<li class='member-delete-flex' ><span id='member-email' >" + data.memberArray[i] + "</span> <button id='delete-btn' style='background-image: url(../images/button_x.jpg);' onclick=deleteUser(\'"+ data.memberArray[i] +"\')> __ </button></li>");
      }
      else {
        listElt = $("<li><span id='member-email' >" + data.memberArray[i] + "</span></li>");
      }

      $('#members').append(listElt);
  }


});

socket.on('deleted user', function(data) {
  if(data.email_to_delete == my_email && chat_name == data.chat_name) {
    alert("You have been deleted from this chatroom");
    window.location.href = '/chatSelect?name=' + username;
  }
  else {
    window.location.reload();
  }


});
