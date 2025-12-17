import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001; // Allow Render to set PORT

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- Strategy Selection ---
const USE_MONGO = !!process.env.MONGODB_URI;

// --- File System Setup (Fallback) ---
const DB_FILE = path.join(__dirname, 'history.json');
if (!USE_MONGO && !fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
}

// --- MongoDB Setup ---
let HistoryModel;
if (USE_MONGO) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('Connected to MongoDB Atlas'))
        .catch(err => console.error('MongoDB Connection Error:', err));

    const historySchema = new mongoose.Schema({
        name: String,
        text: String,
        timestamp: String // ISO string
    });
    // Transform _id to id for frontend consistency
    historySchema.set('toJSON', {
        virtuals: true,
        versionKey: false,
        transform: function (doc, ret) {
            delete ret._id;
        }
    });
    HistoryModel = mongoose.model('History', historySchema);
}

// --- Helper Functions ---
const getHistoryData = async (query) => {
    if (USE_MONGO) {
        let filter = {};
        if (query) {
            const regex = new RegExp(query, 'i');
            filter = { $or: [{ name: regex }, { text: regex }] };
        }
        return await HistoryModel.find(filter).sort({ timestamp: -1 });
    } else {
        // File System
        let data = [];
        try {
            data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        } catch (err) { data = []; }

        // Sort desc
        data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (query) {
            const lowerQ = query.toLowerCase();
            data = data.filter(item =>
                (item.text && item.text.toLowerCase().includes(lowerQ)) ||
                (item.name && item.name.toLowerCase().includes(lowerQ))
            );
        }
        return data;
    }
};

const addHistoryData = async (record) => {
    if (USE_MONGO) {
        const doc = new HistoryModel(record);
        return await doc.save();
    } else {
        const data = await getHistoryData(); // get raw data logic is slightly mixed above, but for file it's fine
        // Re-read file to be safe
        let allData = [];
        try { allData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { }

        allData.push(record);
        fs.writeFileSync(DB_FILE, JSON.stringify(allData, null, 2));
        return record;
    }
};

const deleteHistoryData = async (id) => {
    if (USE_MONGO) {
        const result = await HistoryModel.findByIdAndDelete(id);
        return !!result;
    } else {
        let allData = [];
        try { allData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { }

        const initialLen = allData.length;
        const newData = allData.filter(item => item.id !== id);

        if (newData.length === initialLen) return false;

        fs.writeFileSync(DB_FILE, JSON.stringify(newData, null, 2));
        return true;
    }
};

// --- Routes ---

app.get('/api/history', async (req, res) => {
    try {
        const { q } = req.query;
        const history = await getHistoryData(q);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/history', async (req, res) => {
    try {
        const { name, text, timestamp } = req.body;
        if (!text) return res.status(400).json({ error: 'Text content is required' });

        const newRecord = {
            id: USE_MONGO ? undefined : Date.now().toString(), // Mongo generates its own ID
            name: name || 'Untitled',
            text,
            timestamp: timestamp || new Date().toISOString()
        };

        const result = await addHistoryData(newRecord);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/history/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const success = await deleteHistoryData(id);

        if (!success) return res.status(404).json({ error: 'Record not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log(`Storage Mode: ${USE_MONGO ? 'MongoDB Atlas' : 'Local JSON File'}`);
});
