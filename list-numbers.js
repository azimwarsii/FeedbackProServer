require('dotenv').config({ path: '.env.local' });
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);

async function listNumbers() {
    try {
        const response = await telnyx.phoneNumbers.list();
        console.log("Phone numbers:", JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error("Error listing numbers:", err);
    }
}

listNumbers();
