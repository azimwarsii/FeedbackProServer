require('dotenv').config({ path: '.env.local' });
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);

async function listProfiles() {
    try {
        const response = await telnyx.messagingProfiles.list();
        console.log("Messaging Profiles:", JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error("Error listing profiles:", err);
    }
}

listProfiles();
