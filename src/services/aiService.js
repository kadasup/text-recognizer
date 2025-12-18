export const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

export const identifyText = async (apiKey, fileBase64, prompt = "Identify and transcribe all text in this image. preserve formatting.", customEndpoint = null) => {
    try {
        // Azure Configuration
        let baseEndpoint = customEndpoint || import.meta.env.VITE_AZURE_ENDPOINT || "";

        // Ensure endpoint ends with a slash and is a valid URL base
        if (baseEndpoint && !baseEndpoint.endsWith('/')) {
            baseEndpoint += '/';
        }

        const DEPLOYMENT = import.meta.env.VITE_AZURE_DEPLOYMENT || "gpt-4o"; // Standard name for current vision model
        const API_VERSION = import.meta.env.VITE_AZURE_API_VERSION || "2024-02-15-preview"; // Stable version for vision

        if (!baseEndpoint) {
            throw new Error("Azure Endpoint is missing. Please set it in Settings.");
        }

        if (!apiKey) {
            throw new Error("Azure API Key is missing. Please set it in Settings.");
        }

        let finalDataUrl = fileBase64;
        if (!fileBase64.startsWith('data:')) {
            finalDataUrl = `data:image/jpeg;base64,${fileBase64}`;
        }

        const url = `${baseEndpoint}openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: "You are an AI assistant that identifies and transcribes text from images. Output only the transcribed text."
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
                                image_url: {
                                    url: finalDataUrl
                                }
                            }
                        ]
                    }
                ],
                max_completion_tokens: 2000,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Azure API Request Failed");
        }

        const data = await response.json();
        console.log("Azure API Response:", data); // Debug log

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error("Unexpected API response structure:", data);
            throw new Error("API response is empty or invalid: " + JSON.stringify(data));
        }

        return data.choices[0].message.content;

    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};
