require('dotenv').config();
const { App } = require('@slack/bolt');
const mongoose = require('mongoose');
const Poll = require('./pollModel'); // Import the poll schema

// Initialize Slack Bolt App
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
});

// Connect to MongoDB (ensure local database is running)
mongoose.connect("mongodb://127.0.0.1:27017/slacky", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Slack command to say hello
app.command('/hello', async ({ command, ack, say }) => {
    await ack();
    await say(`Hello, <@${command.user_id}>!`);
});

// Slack command to say name
app.command('/say_name', async ({ command, ack, say }) => {
    await ack();
    await say(`Hello Dear, <@${command.user_id}>! What's up!`);
});

// Slack command to trigger poll
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
//         await respond(`✅ <@${body.user.id}> your vote has been recorded!`);
//     } catch (error) {
//         console.error("❌ MongoDB Update Error:", error);
//         await respond("⚠️ An error occurred while recording your vote.");
//     }
// });


// Define schema & model for storing poll responses
const voteSchema = new mongoose.Schema({
    user_id: String,
    user_name: String,
    choice: String,
    timestamp: { type: Date, default: Date.now }
});
const Vote = mongoose.model('Vote', voteSchema);

// / Define Poll Options with Buttons
const blocks = [
    {
        "type": "section",
        "text": { "type": "mrkdwn", "text": "🍽️ *Food Poll!* What do you want to eat?" }
    },
    {
        "type": "actions",
        "elements": [
            { "type": "button", "text": { "type": "plain_text", "text": "🍕 Pizza" }, "value": "pizza", "action_id": "vote_pizza" },
            { "type": "button", "text": { "type": "plain_text", "text": "🍛 South Indian" }, "value": "south_indian", "action_id": "vote_south_indian" },
            { "type": "button", "text": { "type": "plain_text", "text": "🥗 Veg Thaali" }, "value": "veg_thaali", "action_id": "vote_veg_thaali" },
            { "type": "button", "text": { "type": "plain_text", "text": "🍗 Non-Veg Biryani" }, "value": "non_veg_biryani", "action_id": "vote_non_veg_biryani" },
            { "type": "button", "text": { "type": "plain_text", "text": "🥡 Chinese" }, "value": "chinese", "action_id": "vote_chinese" }
        ]
    }
];

// Function to Send Poll to Slack Channel
async function sendPoll() {
    try {
        const result = await app.client.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            channel: process.env.SLACK_CHANNEL,
            text: "🍽️ *Food Poll!* Vote for your favorite food!",
            blocks: blocks
        });
        console.log("✅ Poll sent successfully!");
    } catch (error) {
        console.error("❌ Error sending poll:", error);
    }
}

// Function to Handle Votes
app.action(/vote_.*/, async ({ body, ack, respond, client }) => {
    await ack(); // Acknowledge the action
    
    const selectedOption = body.actions[0].value;
    const user_id = body.user.id;

    try {
        // Fetch user details from Slack API
        const userInfo = await client.users.info({ user: user_id });
        const user_name = userInfo.user.real_name || userInfo.user.name;

        console.log(`🔹 Saving vote: ${user_name} (${user_id}) -> ${selectedOption}`);

        // Save vote in MongoDB
        const vote = new Vote({ user_id, user_name, choice: selectedOption });
        await vote.save(); // <-- Check if this line throws an error

        console.log(`✅ Vote stored successfully.`);
        await respond(`✅ <@${user_id}>, your vote for *${selectedOption}* has been recorded!`);
    } catch (error) {
        console.error("❌ MongoDB Save Error:", error);  // <-- This will print the actual error
        await respond("⚠️ An error occurred while recording your vote.");
    }
});


// Start Bot & Send Poll
(async () => {
    await app.start(process.env.PORT || 3000);
    console.log(`🚀 Slack bot running on port ${process.env.PORT || 3000}`);
    await sendPoll();
})();