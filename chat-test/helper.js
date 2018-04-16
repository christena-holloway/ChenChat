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

function saveUserToDB(userColl) {
  userColl.save(function(err) {
    if (err) {
      console.log(err);
      res.status(400).send("Bad Request");
    }
    else {
      console.log("successfully posted user " + userColl.fullName + " to db");
    }
  });
}


module.exports = {
  userCol: UserCollection,

  updateUserChatsArray: function(chatName, inEmail) {
    console.log("updating user's chats");
    UserCollection.findOneAndUpdate({ email: inEmail },
      { $addToSet: { chats: chatName } },
      function(err, data) {
        console.log(err);
      }
    );
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

  },

  // add user to db IF THEY'RE NOT ALREADY IN
  addUsersWithEmail: function(chatName, emailAddr) {
    let conditions = { email: emailAddr };
    let update = { $addToSet: { chats: chatName } };
    let options = { upsert: true };

    function callback(err, numAffected) {
      if (err) {
        console.log(err);
      }
      else {
        console.log(numAffected + " changed");
      }

    }

    UserCollection.update(conditions, update, options, callback);
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
