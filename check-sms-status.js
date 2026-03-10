require('dotenv').config({ path: '.env.local' });
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);

async function checkStatus(messageId) {
    try {
        const response = await telnyx.messages.retrieve(messageId);
        console.log("Message status details:", JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error("Error retrieving message:", err);
    }
}

const messageId = process.argv[2];
if (!messageId) {
    console.log("Please provide a message ID");
} else {
    checkStatus(messageId);
}
