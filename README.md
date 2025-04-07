# YouTube Transcript Extractor

I couldn't find a good free Youtube video to Transcript for free, so I made my own.

## Features

- Extract transcripts from YouTube videos
- Copy transcript to clipboard
- Download transcript as a text file
- Modern and responsive UI
- Error handling for invalid URLs and unavailable transcripts

## Requirements

- Node.js 14 or higher
- npm (Node Package Manager)

## Installation

1. Clone this repository
2. Install the required packages:
   ```bash
   npm install
   ```

## Usage

1. Start the server:
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

2. Open your web browser and navigate to `http://localhost:5000`
3. Paste a YouTube video URL into the input field
4. Click "Get Transcript" to extract the transcript
5. Use the "Copy" button to copy the transcript to your clipboard
6. Use the "Download" button to download the transcript as a text file

## Notes

- The application supports various YouTube URL formats (watch, embed, and short URLs)
- Some videos may not have transcripts available
- The transcript extraction is done using the youtube-transcript-api library

## License

MIT 