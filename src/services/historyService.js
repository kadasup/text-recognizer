const API_URL = import.meta.env.VITE_API_URL || ""; // Empty means use proxy in dev

export const saveHistory = async (name, text) => {
    try {
        const response = await fetch(`${API_URL}/api/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, text })
        });
        if (!response.ok) throw new Error('Failed to save history');
        return await response.json();
    } catch (error) {
        console.error('Error saving history:', error);
        return null; // Fail silently to not disrupt user flow
    }
};

export const getHistory = async (query = '') => {
    try {
        const response = await fetch(`${API_URL}/api/history?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to fetch history');
        return await response.json();
    } catch (error) {
        console.error('Error fetching history:', error);
        return [];
    }
};

export const deleteHistory = async (id) => {
    try {
        const response = await fetch(`${API_URL}/api/history/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete history');
        return true;
    } catch (error) {
        console.error('Error deleting history:', error);
        return false;
    }
};
