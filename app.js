const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');
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

        // Format each transcript entry with timestamp
        const formattedTranscript = transcripts.map(entry => {
            const timestamp = formatTimestamp(entry.offset / 1000); // Convert milliseconds to seconds
            return `${timestamp} - ${entry.text}`;
        }).join('\n');
        
        return res.json({
            success: true,
            transcript: formattedTranscript
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