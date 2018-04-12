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
  window.location.href = '#openModal';
}


function addNewMembers() {
  console.log('Enter addMembers function');
  let emails = document.getElementById("chat_mems").value;
  if (emails == null) {
    window.location.href = '#close';
  }

  let stripped = emails.replace(/\s/g, "");
  let splitArr = stripped.split(',');
  let emailArr = splitArr.filter(item => item.trim() !== '');


  let itemFound = false;
  for (let i = 0; i < emailArr.length; i++) {
    $('#members li').each( function() {
      if ( $(this).text() === emailArr[i] ) {
        itemFound = true;
      }
    });

    if (!itemFound) {
      let memlist = $('<li>').append(emailArr[i]);
      memlist = memlist.append($('<br>'));
      $('#members').append(memlist);
    }
  }

  socket.emit('chat name', chat_name);
  socket.emit('entered emails', emails);

  window.location.href = '#close';
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
    console.log('adding members');
    addNewMembers();
    return false;
  });
  $('#flex-msg-form').submit(function() {
      console.log('emitting message');
      socket.emit('chat message', { msg: $('#m').val(), timestamp: time, chat_token: chat_name, sent_name: username });
      $('#m').val('');
    return false;
  });
  socket.on('chat message', function(data) {
    let sender = data.from;
    let msg = data.message;
    let chatRoomName = data.chatRoomName;
    if (chat_name == chatRoomName) {
      let listElt = $('<li>').text(sender + ": " + msg);
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
  if(is_creator == "true") {
    socket.emit('chatroom delete user', {emailAddress:emailAddress, chat_name:chat_name});
    alert(emailAddress.toString() + ', You been deleted from this chatroom ');
  }
  else {
    alert("You are not the creator of this chatroom and cannot delete users.");
  }
}


socket.on('set email', function(data) {
  my_email = data.email;
  for (i = 0; i < data.memberArray.length; i++) {
      //var listElt = $('<li>').text(memberArray[i]);
      //$('#members').append(listElt);
      var listElt;
      if(is_creator == "true" && my_email != data.memberArray[i]) {
        listElt = $("<li><p>" + data.memberArray[i] + "</p> <button onclick=deleteUser(\'"+ data.memberArray[i] +"\')>DELETE</button></li>");
      }
      else {
        listElt = $("<li><p>" + data.memberArray[i] + "</p></li>");
      }

      $('#members').append(listElt);
  }


});

socket.on('deleted user', function(data) {
  if(data.user_to_delete == username && chat_name == data.chat_name) {
    alert("You have been deleted from this chatroom");
    window.location.href = '/chatSelect?name=' + username;
  }
});
