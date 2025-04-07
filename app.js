const express = require('express');
const cors = require('cors');
const { YouTubeTranscript } = require('youtube-transcript-api');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

        const transcript = await YouTubeTranscript.fetchTranscript(videoId);
        const text = transcript.map(entry => entry.text).join(' ');
        
        return res.json({
            success: true,
            transcript: text
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