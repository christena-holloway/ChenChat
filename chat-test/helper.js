var express = require('express');
var app = express();
var jwtDecode = require('jwt-decode');
var mailer = require('express-mailer');
var moment = require('moment');

app.set('view engine', 'pug');
app.engine('html', require('ejs').renderFile);

mailer.extend(app, {
  from: 'ChenChat <chenchat498@gmail.com>',
  host: 'smtp.gmail.com', // hostname
  secureConnection: true, // use SSL
  port: 465, // port for secure SMTP
  transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts
  auth: {
    user: 'chenchat498@gmail.com',
    pass: 'a532tVhQ6vWq?kL-'
  }
});

module.exports = {

	handleMessage: function(data) {
		var result = data.queryResult;
		var action = result.action;
	  var parameters = result.parameters;
	  var chatRoom = parameters.chatroom;
	  var msg = '';

	  console.log("Action is " + action);
	  console.log("Chat room is " + chatRoom);

	  if (action === 'sendHelp') {
	    var state = parameters.state;
	    var location = parameters.location;
	    msg += 'I need help now. My location is: ' + location + '.';
	  }
	  else if (action === 'switchMode') {
	    var mode = parameters.mode;
	    msg += 'I need help ' + mode + '!';
	  }
	  else if (action === 'reportState') {
	    var state = parameters.state;
	    msg += 'I ' + state + '!';
	  }
	  else if (action === 'whereIsMy') {
	    var object = parameters.object;
	    msg += 'Where is my ' + object + '?';
	  }
	  else if (action === 'sendCustomMessage') {
	    msg += parameters.customMessage;
	  }
	  else if (action === 'changeChatRoom') {
	    console.log("Switching chat rooms");
	    // var chatRoom = jsonMessage.queryResult.parameters.chatroom;
	    io.emit('getChatRoomFromGoogleApi', chatRoom);
	    return "Changed to room " + chatRoom;
	  }
	  // default handler
	  else {
	    msg += 'I am trying to communicate with you but something went wrong!';
	  }

	  return msg;
	},

	sendInvite: function(emailArr, chatName, username) {
		var emailString = emailArr.join();
	  // Setup email data.
	  var mailOptions = {
	    bcc: emailString,
	    subject: username + ' invited to the chatroom "' + chatName + '" on ChenChat!',
	    data: {  // data to view template, you can access as - user.name
	      chatname: chatName,
	      sender: username
	    }
	  }

	  // Send email
	  app.mailer.send('email', mailOptions, function (err, message) {
	    if (err) {
	      console.log("ERROR: couldn't send email " + err);
	      return;
	    }
	  });
	},

	getTimestamp: function() {
		var now = moment();
	  var time = now.format('YYYY-MM-DD hh:mm A');
	  return time;
	},

	getUID: function(id_token) {
		var decoded = jwtDecode(id_token);
	  var sub = decoded['sub'];
	  return sub;
	},

	getName: function(id_token) {
		var decoded = jwtDecode(id_token);
	  var name = decoded['name'];
	  return name;
	},

	getEmail: function(id_token) {
		var decoded = jwtDecode(id_token);
    var email = decoded['email'];
    return email;
	},

	sendUserInfo: function(token, email, UserCollection) {
		let sub = this.getUID(token);
	  let name = this.getName(token);
	  //might wanna change email back to local variable? (global rn to add current user to chat members)
	  email = this.getEmail(token);

	  UserCollection.count({ userID: sub }, function(err, count) {
	    if (count === 0) {
	      var u = new UserCollection({ 'userID': sub, 'fullName': name, 'email': email });
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

}