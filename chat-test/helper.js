var express = require('express');
var app = express();
var jwtDecode = require('jwt-decode');
var mailer = require('express-mailer');
var moment = require('moment');
var mongoose = require('mongoose');

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

var userSchema = new mongoose.Schema({
  userID: String,
  fullName: String,
  email: String,
  chats: []
}, {collection: "users"});

var UserCollection = mongoose.model("User", userSchema);


module.exports = {
  email: "temp",
  
	handleMessage: function(data) {
		let result = data.queryResult;
		let action = result.action;
	  let parameters = result.parameters;
	  let chatRoom = parameters.chatroom;
	  let msg = '';

	  console.log("Action is " + action);
	  console.log("Chat room is " + chatRoom);

	  if (action === 'sendHelp') {
	    let state = parameters.state;
	    let location = parameters.location;
	    msg += 'I need help now. My location is: ' + location + '.';
	  }
	  else if (action === 'switchMode') {
	    let mode = parameters.mode;
	    msg += 'I need help ' + mode + '!';
	  }
	  else if (action === 'reportState') {
	    let state = parameters.state;
	    msg += 'I ' + state + '!';
	  }
	  else if (action === 'whereIsMy') {
	    let object = parameters.object;
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

  // run only if there is something in the email array! (handled in server?)
	sendInvite: function(emailArr, chatName, username) {
		let emailString = emailArr.join();
	  // Setup email data.
	  let mailOptions = {
	    bcc: emailString,
	    subject: username + ' invited to the chatroom "' + chatName + '" on ChenChat!',
	    data: {  // data to view template, you can access as - user.name
	      chatname: chatName,
	      sender: username
	    }
	  };

	  // Send email
	  app.mailer.send('email', mailOptions, function (err, message) {
	    if (err) {
	      console.log("ERROR: couldn't send email " + err);
	      return;
	    }
	  });
    
    // add user to db if they're not already in
    //console.log("EMAILARR: " + emailArr);
    emailArr.push(this.email);
    for (let i = 0; i < emailArr.length; i++) {
      UserCollection.count({ email: emailArr[i] }, function(err, count) {
        // if user is not in db
        if (count === 0) {
          let u = new UserCollection({ 'userID': '', 'fullName': '', 'email': emailArr[i], 'chats': [] });
          //append new chat to chats array
          u.chats.push(chatName);
          saveUserToDB(u);
        }
        else {
          // update chats array in user's doc
          console.log("user is already in db");
          // find user's doc
          UserCollection.findOne({ 'email': emailArr[i] }, function (err, doc) {
            /*probably need to account for user already being 
            in this chat room (maybe just do when displaying 
            rooms on chatSelect*/
            let user = doc;
            //console.log("USER DOC IS: " + user);
            if (err) {
              console.log(err);
              res.status(400).send("Bad Request");
            }
            user.chats.push(chatName);
            saveUserToDB(user);
          });
        }
      });
    }
  },

	getTimestamp: function() {
		let now = moment();
	  let time = now.format('YYYY-MM-DD hh:mm A');
	  return time;
	},

	getUID: function(id_token) {
		let decoded = jwtDecode(id_token);
	  let sub = decoded.sub;
	  return sub;
	},

	getName: function(id_token) {
		let decoded = jwtDecode(id_token);
	  let name = decoded.name;
	  return name;
	},

	getEmail: function(id_token) {
		let decoded = jwtDecode(id_token);
    let email = decoded.email;
    return email;
	},

  // only runs on index when user logs in (so chats array doesn't need to change)
	sendUserInfo: function(token) {
		let sub = this.getUID(token);
	  let name = this.getName(token);
	  //might wanna change email back to local variable? (global rn to add current user to chat members)
	  email = this.getEmail(token);
    this.email = email;
    //console.log("This.EMAIL: " + this.email);
    //console.log("EMAIL: " + email);
	  UserCollection.count({ userID: sub }, function(err, count) {
	    if (count === 0) {
	      var u = new UserCollection({ 'userID': sub, 'fullName': name, 'email': email, 'chats': [] });
	      saveUserToDB(u);
	    }
	    else {
	      console.log("user is already in db");
	    }
	  });
	}
};

function saveUserToDB(userColl) {
  userColl.save(function(err) {
    if (err) {
      console.log(err);
      res.status(400).send("Bad Request");
    }
    else {
      console.log("successfully posted user info to db");
    }
  });
}