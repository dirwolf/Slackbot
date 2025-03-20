require('dotenv').config();
const { App } = require('@slack/bolt');
const mongoose = require('mongoose');

// Initialize Slack Bolt App
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
    pingInterval: 15000,
});

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/slacky", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));


const voteSchema = new mongoose.Schema({
    user_id: String,
    user_name: String,
    choice: String,
    timestamp: { type: Date, default: Date.now }
});
const Vote = mongoose.model('Vote', voteSchema);

const POLL_DURATION = 60 * 60 * 1000; 
const MAX_VOTES_PER_DISH = 5; 
let pollActive = true; 


const blocks = [
    {
        type: "section",
        text: { type: "mrkdwn", text: "🍽️ *Food Poll!* What do you want to eat?" }
    },
    {
        type: "actions",
        elements: [
            { type: "button", text: { type: "plain_text", text: "🍕 Pizza" }, value: "pizza", action_id: "vote_pizza" },
            { type: "button", text: { type: "plain_text", text: "🍛 South Indian" }, value: "south_indian", action_id: "vote_south_indian" },
            { type: "button", text: { type: "plain_text", text: "🥗 Veg Thaali" }, value: "veg_thaali", action_id: "vote_veg_thaali" },
            { type: "button", text: { type: "plain_text", text: "🍗 Non-Veg Biryani" }, value: "non_veg_biryani", action_id: "vote_non_veg_biryani" },
            { type: "button", text: { type: "plain_text", text: "🥡 Chinese" }, value: "chinese", action_id: "vote_chinese" }
        ]
    }
];

// Function to send poll
async function sendPoll() {
    try {
        const result = await app.client.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            channel: process.env.SLACK_CHANNEL,
            text: "🍽️ *Food Poll!* Vote for your favorite food!",
            blocks: blocks
        });
        console.log("✅ Poll sent successfully!");

        // Schedule poll closure
        setTimeout(() => closePoll(result.channel, result.ts), POLL_DURATION);
    } catch (error) {
        console.error("❌ Error sending poll:", error);
    }
}
async function closePoll(channelId, messageTs) {
    pollActive = false;
    try {
        await app.client.chat.update({
            token: process.env.SLACK_BOT_TOKEN,
            channel: channelId,
            ts: messageTs,
            text: "🚫 *Poll Closed* - Voting is no longer available.",
            blocks: [{
                type: "section",
                text: { type: "mrkdwn", text: "🚫 *Poll Closed* - Voting is no longer available." }
            }]
        });
        console.log("✅ Poll closed successfully.");
    } catch (error) {
        console.error("❌ Error closing poll:", error);
    }
}

// Handle votes
app.action(/vote_.*/, async ({ body, ack, client }) => {
    await ack();
    if (!pollActive) {
        await client.chat.postEphemeral({
            channel: body.channel.id,
            user: body.user.id,
            text: "⚠️ The poll has already closed. You can't vote now."
        });
        return;
    }
    
    const selectedOption = body.actions[0].value;
    const user_id = body.user.id;
    const currentVoteCount = await Vote.countDocuments({ choice: selectedOption });

    if (currentVoteCount >= MAX_VOTES_PER_DISH) {
        await client.chat.postEphemeral({
            channel: body.channel.id,
            user: body.user.id,
            text: `⚠️ Max votes for *${selectedOption.replace("_", " ")}* reached. Choose another dish!`
        });
        return;
    }

    try {
        await Vote.updateOne(
            { user_id },
            { user_id, choice: selectedOption, timestamp: new Date() },
            { upsert: true }
        );
        await client.chat.postEphemeral({
            channel: body.channel.id,
            user: body.user.id,
            text: `✅ Your vote for *${selectedOption.replace("_", " ")}* has been recorded.`
        });
    } catch (error) {
        console.error("❌ MongoDB Save Error:", error);
        await client.chat.postEphemeral({
            channel: body.channel.id,
            user: body.user.id,
            text: "⚠️ Error recording your vote. Try again later."
        });
    }
});

// Start bot
(async () => {
    await app.start(process.env.PORT || 3000);
    console.log(`🚀 Slack bot running on port ${process.env.PORT || 3000}`);
    await sendPoll();
})();


// postEphemeral is a method used in Slack Bolt to send a temporary (ephemeral) 
// message that is only visible to a specific user instead of the whole channel.