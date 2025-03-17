require('dotenv').config();
const mongoose = require('mongoose');
const { startBot } = require('./app');

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/slacky", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));


// Start the Slack bot
startBot();


// const { App } = require('@slack/bolt');
// const mongoose = require('mongoose');
// require = require("esm")(module/*, options*/)
// module.exports = require("./app.js")
// const Poll = require('./pollModel'); // Import the poll schema

// require('dotenv').config();

// const app = new App({
//     token: process.env.SLACK_BOT_TOKEN,
//     signingSecret: process.env.SLACK_SIGNING_SECRET,
//     appToken: process.env.SLACK_APP_TOKEN,
//     socketMode: true,
// });

// // Connect to MongoDB (ensure local database is running)
// mongoose.connect("mongodb://127.0.0.1:27017/slacky", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// })
// .then(() => console.log("✅ Connected to MongoDB"))
// .catch(err => console.error("❌ MongoDB connection error:", err));

// app.command('/hello', async ({ command, ack, say }) => {
//     // Acknowledge the command request
//     await ack();

//     // Respond to the user
//     await say(`Hello, <@${command.user_id}>!`);
// });

// app.command('/say_name', async ({ command, ack, say }) => {
//     // Acknowledge the command
//     await ack();

//     // Extract the text input (if any)
//     // const name = command.text.trim(); // Slack passes extra input as text

//     // Determine what name to use
//     const displayName = `<@${command.user_id}>`; // Use given name or Slack username

//     // Send the response
//     await say(`Hello Dear, ${displayName}! What's up!`);
// });

// // Slack command to trigger poll
// app.command('/food_poll', async ({ command, ack, respond }) => {
//     await ack();

//     await respond({
//         text: "🍽️ *Food Poll!* Choose your favorite:",
//         attachments: [
//             {
//                 text: "Pick an option:",
//                 fallback: "You cannot vote",
//                 callback_id: "food_poll",
//                 color: "#3AA3E3",
//                 attachment_type: "default",
//                 actions: [
//                     { name: "food", text: "🍕 Pizza", type: "button", value: "pizza" },
//                     { name: "food", text: "🍔 Burger", type: "button", value: "burger" },
//                     { name: "food", text: "🍣 Sushi", type: "button", value: "sushi" }
//                 ]
//             }
//         ]
//     });
// });

// // Handle poll voting
// app.action(/food_poll/, async ({ body, ack, respond }) => {
//     await ack(); // Acknowledge the Slack action

//     const selectedOption = body.actions[0].value;
//     console.log(`🔹 User ${body.user.id} voted for ${selectedOption}`);

//     try {
//         // Find the option in MongoDB and increment vote count
//         await Poll.findOneAndUpdate(
//             { option: selectedOption }, 
//             { $inc: { votes: 1 } }, 
//             { upsert: true, new: true, setDefaultsOnInsert: true }
//         );

//         console.log(`✅ MongoDB Updated: ${selectedOption} vote stored successfully.`);

//         // Just confirm the vote without showing results
//         await respond(`✅ <@${body.user.id}> your vote has been recorded!`);
//     } catch (error) {
//         console.error("❌ MongoDB Update Error:", error);
//         await respond("⚠️ An error occurred while recording your vote.");
//     }
// });

// (async () => {
//     await app.start(process.env.PORT || 3000);
//     console.log(`🚀 Bot app is running on port ${process.env.PORT || 3000}!`);
// })();
