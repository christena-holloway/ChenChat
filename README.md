# ChenChat

# Google Home Setup Instructions:
**Dialogflow** Link: [https://console.dialogflow.com/api-client/#/login](https://console.dialogflow.com/api-client/#/login)
Steps to sign in:
1. Go to the above link and sign in using your umich email address that was given permission to access Dialogflow for ChenChat
2. In the “Try it now” field, enter a command to trigger one of the intents. To learn about how to use intents, select any one of the intents and take a look at the example training phrases and enter something similar!

**Actions on Google link**: [https://developers.google.com/actions/](https://developers.google.com/actions/)
Steps to sign in:
1. Go to the above link and sign in using your umich email address that was given permission to access Actions on Google for ChenChat
2. Click on the “Actions console” button and go to the Simulator
3. You can toggle the “Surface” option to use speaker mode if you’re testing using the Google Home device

## Steps to test ChenChat on the Google Home:
1. Download Google Home app from app store.
2. Setup Google device on the Google Home app.
    * The Google Home will only connect to Wi-fi networks that do not require both, a username and password.  For example, it will not connect to a university wireless network such as MWireless, which requires both your uniqname id and your password. In that case, you must instead use a personal hotspot to connect your Google device to the network.
			+ First make sure your phone is connected to the same hotspot that you will use to connect your Google device.
			+ Make sure the **Google account** you connect your device to is the same one that has been given access to Dialogflow and Actions on Google.
3. Make sure you are also connected to **Actions on Google** when testing ChenChat with the device otherwise it won’t recognize your command to start the app
4. Finally, begin by saying “Hey Google, talk to C-chat”
5. Speak any of the prompts for the intents configured into the system and start chenchatting!

# Instructions for Web Application Use:
1. Navigate to website at [chenchat2.azurewebsites.net](chenchat2.azurewebsites.net)
2. Start by clicking the sign in button, and enter your Google username and password in the pop-up window.
3. After you've finished signing in to Google, you will be redirected to the "Find Your Chat Group" page. Here, you can enter an existing chat group or create a new one.  

# What’s a Chat Group?
A chat group is defined by the name that you give it upon creation.  You can invite and add members to the group by entering their gmail addresses.  Chat groups can be used to communicate with multiple people or just one.  Make sure you separate the addresses with a comma ‘,’ if you’re inviting multiple people.  

Upon invitation, the group members will receive an email asking them to join your chat.  Once they navigate to your chat group, all of the members will be able to send and receive messages along with the Google Home user.  

After submitting your new chat group, you will be redirected to your group chat where you can see all messages that were previously sent as well as any new messages.  Now you can send your own messages! Try typing a message in the text box and hitting submit.  All of the group members will now see your message.  If you'd like change group chats or invite more people, click the "back" button in the upper left corner.
ChenChat can also be used on any mobile device.  Your friends can navigate to the url and send/receive messages from his or her phone.

# Instructions for Using ChenChat with Google Home:
1. Begin by saying either “hey, Google" or “ok, Google" to Google Home.
2. Now we can start up ChenChat!  Tell Google to "Talk to C-Chat.”
3. Once you start ChenChat from the Google Home, the device will listen for your next command until you tell it to end the application.  Examples for commands to end the app are provided below.
4. Once the application is started, you can give the application a variety of commands.  Following are a list of examples, but you can also try saying variations of these phrases.

## List of Commands
1. Send for help
	* "Help me."
	* "Call for help!"
	* "Send help.”
2. Say how you're feeling
 	* "I want to go to bed.”
 	* "I'm thirsty!"
 	* “Starving!"
3. Express a personal need
 	* “I need to type.”
 	* “I need to use the phone.”
 	* “I want to use the mouse.”
4. Ask for help finding objects
 	* “I need my straw.”
 	* “I can’t find my mouthpiece.”
5. Create a chat group or navigate to an existing one
 	* “Enter chat group <chat group name>.”
 	    - “Enter chat group ‘Food’.”
	* Once you change the chat room using the Google home, the ChenChat server will automatically navigate all users to the same chatroom that was requested. Think of this as a convenience for users like Chun-Han. For example, when Chun-Han changes the chatroom to “fruits”, it will lead all users to the room “fruits”. In a way, all users are forced to follow Chun-Han’s needs. It ensures that there are users on the other end that are listening to Chun-Han’s requests.
6. Customize your own message
 	* “Send message <custom message>.”
 	    - Example: “Send message ‘Come downstairs’.”
 	* “Send <custom message> to <chat room name>.”
 	    - Example: “Send ‘What’s up’ to ‘Friends’.”
 	* “Say <custom message> to <chat room name>.”
7. End a conversation with the ChenChat app
 	* “Leave chat."
 	* "I'm done chatting."
 	* "Close app.”
