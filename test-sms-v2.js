require('dotenv').config({ path: '.env.local' });
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);

async function testSms() {
    try {
        console.log("Sending SMS from", process.env.TELNYX_PHONE_NUMBER, "to +12812166971...");
        const response = await telnyx.messages.send({
            from: process.env.TELNYX_PHONE_NUMBER,
            to: "+12812166971",
            text: "Success! This is a test message from FeedbackPro with the new V2 API Key!"
        });
        console.log("Success! Message details:", JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error("Error sending message:", err);
        if (err.error && err.error.errors) {
            console.error("Error details:", JSON.stringify(err.error.errors, null, 2));
        }
    }
}

testSms();
