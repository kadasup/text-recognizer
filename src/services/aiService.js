const API_URL = import.meta.env.VITE_API_URL || ""; // Empty means use proxy in dev

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
        // apiKey argument is now ignored as we use backend secrets

        console.log("Sending request to backend API...");

        const response = await fetch(`${API_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: fileBase64,
                prompt: prompt
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Backend API Error:", data);
            throw new Error(data.error || "Failed to analyze image");
        }

        return data.text;

    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};
