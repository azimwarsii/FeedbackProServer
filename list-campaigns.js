require('dotenv').config({ path: '.env.local' });
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);

async function listCampaigns() {
    try {
        // Note: The Telnyx Node SDK might not have a direct 'messagingCampaigns' top-level, 
        // but we can try common paths or check the documentation.
        // For 10DLC, it's often under 'messagingCampaigns' or similar.
        const response = await telnyx.messagingCampaigns.list();
        console.log("Messaging Campaigns:", JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error("Error listing campaigns:", err);
    }
}

listCampaigns();
