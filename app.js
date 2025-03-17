const { RTMClient } = require('@slack/rtm-api');
const { WebClient } = require('@slack/web-api');
const express = require('express');
const bodyParser = require('body-parser');
const PollResponse = require('./pollModel');

const rtm = new RTMClient(process.env.SLACK_BOT_TOKEN, {
    logLevel: 'debug',
    autoReconnect: true,
    keepAlive: true
});
const web = new WebClient(process.env.SLACK_BOT_TOKEN);
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

async function startBot() {
    console.log("🔄 Starting Slack RTM...");
    try {
        await rtm.start();
        console.log("🤖 Bot started and listening for events!");
    } catch (error) {
        console.error("❌ Error starting RTM:", error);
    }
}

// Start Express server for Slack interactions
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Handle interactive poll responses
app.post('/slack/actions', async (req, res) => {
    try {
        const payload = JSON.parse(req.body.payload);
        const { user, actions } = payload;

        if (actions && actions.length > 0) {
            const choice = actions[0].value;
            console.log(`✅ Poll response received: ${user.id} voted for ${choice}`);

            // Store in MongoDB
            const pollResponse = new PollResponse({
                userId: user.id,
                choice: choice,
            });

            await pollResponse.save();

            // Acknowledge Slack
            res.json({ text: `✅ Your vote for *${choice}* has been recorded!` });
        }
    } catch (error) {
        console.error("❌ Error handling poll response:", error);
        res.status(500).send("Something went wrong.");
    }
});

// Send poll
async function sendPoll(channel) {
    await web.chat.postMessage({
        channel,
        text: "🍽️ *Food Poll!* Choose your favorite:",
        attachments: [
            {
                text: "Pick an option:",
                callback_id: "food_poll",
                color: "#3AA3E3",
                attachment_type: "default",
                actions: [
                    { name: "food", text: "🍕 Pizza", type: "button", value: "pizza" },
                    { name: "food", text: "🍔 Burger", type: "button", value: "burger" },
                    { name: "food", text: "🍣 Sushi", type: "button", value: "sushi" }
                ]
            }
        ]
    });
}

// Listen for user commands
rtm.on('message', async (event) => {
    console.log("📩 Received message event:", event);
    if (!event.text || event.subtype === 'bot_message') return;

    if (event.text === '!hello') {
        sendMessage(event.channel, `Heya! <@${event.user}>`);
    } else if (event.text.startsWith('!say_name')) {
        sendMessage(event.channel, `Hello Dear, <@${event.user}>! What's up!`);
    } else if (event.text.startsWith('!food_poll')) {
        sendPoll(event.channel);
    }
});

async function sendMessage(channel, message) {
    await web.chat.postMessage({ channel, text: message });
}

module.exports = { startBot };
