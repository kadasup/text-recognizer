const https = require('https');

const apiKey = "AIzaSyB7MIbyzDIctW0jMP2dxgqljNII9X_uPGw";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const models = JSON.parse(data);
            if (models.models) {
                console.log("Available Models:");
                models.models.forEach(m => {
                    if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                        console.log("- " + m.name.replace("models/", ""));
                    }
                });
            } else {
                console.log("Error response:", data);
            }
        } catch (e) {
            console.log("Parse error:", e);
        }
    });
}).on('error', (e) => {
    console.error(e);
});
