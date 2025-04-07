document.addEventListener('DOMContentLoaded', function() {
    const videoUrlInput = document.getElementById('videoUrl');
    const getTranscriptBtn = document.getElementById('getTranscript');
    const loadingDiv = document.querySelector('.loading');
    const resultDiv = document.getElementById('result');
    const transcriptContent = document.getElementById('transcriptContent');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const toggleTimestampsBtn = document.getElementById('toggleTimestamps');
    const errorDiv = document.getElementById('error');
    const errorMessage = document.getElementById('errorMessage');
    const totalTranscriptsEl = document.getElementById('totalTranscripts');
    const lastUpdatedEl = document.getElementById('lastUpdated');

    let showTimestamps = true;
    let originalTranscript = '';

    // Function to format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    // Function to update statistics display
    function updateStatsDisplay(stats) {
        totalTranscriptsEl.textContent = `Total Transcripts: ${stats.totalTranscripts}`;
        lastUpdatedEl.textContent = `Last updated: ${formatDate(stats.lastUpdated)}`;
    }

    // Load initial statistics
    async function loadStats() {
        try {
            const response = await fetch('/stats');
            const stats = await response.json();
            updateStatsDisplay(stats);
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }
    }

    // Load statistics when page loads
    loadStats();

    // Function to decode HTML entities
    function decodeHTMLEntities(text) {
        // First pass: decode common entities
        const entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&apos;': "'",
            '&nbsp;': ' ',
            '&amp;#39;': "'",
            '&amp;amp;': '&',
            '&amp;quot;': '"'
        };

        // Replace all known entities
        let decoded = text;
        for (const [entity, char] of Object.entries(entities)) {
            decoded = decoded.replace(new RegExp(entity, 'g'), char);
        }

        // Second pass: handle numeric entities
        decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
            return String.fromCharCode(dec);
        });

        // Third pass: handle hex entities
        decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
        });

        return decoded;
    }

    // Function to format transcript into proper sentences
    function formatTranscript(text) {
        // Split into lines and process each line
        const lines = text.split('\n');
        let formattedLines = [];
        let currentSentence = '';
        let currentTimestamp = '';

        for (const line of lines) {
            // Extract timestamp if present
            const timestampMatch = line.match(/^(\d+:\d+) - /);
            if (timestampMatch) {
                currentTimestamp = timestampMatch[1];
                const textAfterTimestamp = line.replace(/^\d+:\d+ - /, '');
                
                // Split text into sentences
                const sentences = textAfterTimestamp.split(/(?<=[.!?])\s+/);
                
                // Process each sentence
                for (let i = 0; i < sentences.length; i++) {
                    const sentence = sentences[i].trim();
                    if (sentence) {
                        if (i === 0) {
                            // First sentence gets the timestamp
                            formattedLines.push(`${currentTimestamp} - ${sentence}`);
                        } else {
                            // Subsequent sentences in the same line get the same timestamp
                            formattedLines.push(`${currentTimestamp} - ${sentence}`);
                        }
                    }
                }
            } else {
                // Line without timestamp, just add it as is
                formattedLines.push(line);
            }
        }

        return formattedLines.join('\n');
    }

    getTranscriptBtn.addEventListener('click', async function() {
        const url = videoUrlInput.value.trim();
        if (!url) {
            showError('Please enter a YouTube URL');
            return;
        }

        loadingDiv.classList.add('active');
        resultDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');

        try {
            const response = await fetch('/get_transcript', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url })
            });

            const data = await response.json();

            if (data.error) {
                showError(data.error);
            } else {
                // Decode HTML entities and format the transcript
                const decodedTranscript = decodeHTMLEntities(data.transcript);
                originalTranscript = formatTranscript(decodedTranscript);
                transcriptContent.textContent = originalTranscript;
                resultDiv.classList.remove('hidden');
                toggleTimestampsBtn.textContent = 'Hide Timestamps';
                showTimestamps = true;

                // Update statistics display
                if (data.stats) {
                    updateStatsDisplay(data.stats);
                }
            }
        } catch (error) {
            showError('An error occurred while fetching the transcript');
        } finally {
            loadingDiv.classList.remove('active');
        }
    });

    toggleTimestampsBtn.addEventListener('click', function() {
        if (!originalTranscript) return;

        if (showTimestamps) {
            // Remove timestamps
            const lines = originalTranscript.split('\n');
            const textOnly = lines.map(line => {
                const timestampMatch = line.match(/^\d+:\d+ - /);
                return timestampMatch ? line.replace(timestampMatch[0], '') : line;
            }).join('\n');
            
            transcriptContent.textContent = textOnly;
            toggleTimestampsBtn.textContent = 'Show Timestamps';
        } else {
            // Show timestamps
            transcriptContent.textContent = originalTranscript;
            toggleTimestampsBtn.textContent = 'Hide Timestamps';
        }
        
        showTimestamps = !showTimestamps;
    });

    copyBtn.addEventListener('click', function() {
        const text = transcriptContent.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        });
    });

    downloadBtn.addEventListener('click', function() {
        const text = transcriptContent.textContent;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transcript.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}); 