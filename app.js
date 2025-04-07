const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Statistics file path
const statsPath = path.join(__dirname, 'stats.json');

// Function to read statistics
function readStats() {
    try {
        const data = fs.readFileSync(statsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {
            totalTranscripts: 0,
            lastUpdated: new Date().toISOString()
        };
    }
}

// Function to update statistics
function updateStats() {
    const stats = readStats();
    stats.totalTranscripts += 1;
    stats.lastUpdated = new Date().toISOString();
    
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    return stats;
}

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get statistics endpoint
app.get('/stats', (req, res) => {
    try {
        const stats = readStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read statistics' });
    }
});

// Convert seconds to timestamp format (MM:SS)
function formatTimestamp(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Extract video ID from various YouTube URL formats
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
        /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    return null;
}

// API endpoint to get transcript
app.post('/get_transcript', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'No URL provided' });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const transcripts = await YoutubeTranscript.fetchTranscript(videoId);
        
        if (!transcripts || transcripts.length === 0) {
            return res.status(404).json({ error: 'No transcript available for this video' });
        }

        // Update statistics
        const stats = updateStats();

        // Format each transcript entry with timestamp
        const formattedTranscript = transcripts.map(entry => {
            const startTime = entry.start || entry.offset || 0;
            const timestamp = formatTimestamp(startTime);
            return `${timestamp} - ${entry.text}`;
        }).join('\n');
        
        return res.json({
            success: true,
            transcript: formattedTranscript,
            stats: stats
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: error.message || 'An error occurred while fetching the transcript' 
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 