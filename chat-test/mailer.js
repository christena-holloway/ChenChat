var pug = require('pug');
var fs = require('fs')
var nodemailer = require('nodemailer');

var FROM_ADDRESS = 'chenchat498@gmail.com';
//var TO_ADDRESS = emailArr.join();

var smtpTransport = nodemailer.createTransport("SMTP", {
  service: 'Gmail',
  auth: {
    user: 'chenchat498@gmail.com',
    pass: 'a532tVhQ6vWq?kL-'
  }
});

var sendMail = function(toAddress, content, next) {
  var mailOptions = {
    from: 'SENDERS NAME <' + FROM_ADDRESS + '>',
    to: toAddress,
    replyTo: fromAddress,
    subject: subject,
    html: content
  };
  
  smtpTransport.sendMail(mailOptions, next);
};

exports.sendInvite = function(req, res) {
  var template = process.cwd() + 'emails/invite/html.pug';
  
  // get template from file system
  fs.readFile(template, 'utf8', function(err, file){
    if(err){
      //handle errors
      console.log('ERROR!');
      return res.send('ERROR!');
    }
    else {
      //compile pug template into function
      var compiledTmpl = pug.compile(file, {filename: template});
      // set context to be used in template
      var context = {title: 'Express'};
      // get html back as a string with the context applied;
      var html = compiledTmpl(context);

      sendMail(TO_ADDRESS, html, function(err, response){
        if(err){
          console.log('ERROR!');
          return res.send('ERROR');
        }
        res.send("Email sent!");
      });
    }
  });
};