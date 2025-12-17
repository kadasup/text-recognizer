export const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

export const identifyText = async (apiKey, fileBase64, prompt = "Identify and transcribe all text in this image. preserve formatting.") => {
    try {
        // Azure Configuration - these usually come from env, but can use passed apiKey if needed
        const ENDPOINT = import.meta.env.VITE_AZURE_ENDPOINT || "";
        const DEPLOYMENT = import.meta.env.VITE_AZURE_DEPLOYMENT || "gpt-5.2";
        const API_VERSION = import.meta.env.VITE_AZURE_API_VERSION || "2025-04-01-preview";

        // Remove data URL prefix if present to keep consistency, though OpenAI payload usually takes full data URL for some libraries, 
        // passing base64 directly to image_url with spec is safer.
        // Actually OpenAI API expects "data:image/jpeg;base64,{base64_string}" in url field.
        // So we need to ensure the prefix IS present.

        let finalDataUrl = fileBase64;
        if (!fileBase64.startsWith('data:')) {
            // If we somehow got raw base64 without prefix (from previous Gemini logic edits?), add it back.
            // Assumption: jpeg default.
            finalDataUrl = `data:image/jpeg;base64,${fileBase64}`;
        }

        const url = `${ENDPOINT}openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;

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
