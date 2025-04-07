document.addEventListener('DOMContentLoaded', function() {
    const videoUrlInput = document.getElementById('videoUrl');
    const getTranscriptBtn = document.getElementById('getTranscript');
    const loadingDiv = document.querySelector('.loading');
    const resultDiv = document.getElementById('result');
    const transcriptContent = document.getElementById('transcriptContent');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const errorDiv = document.getElementById('error');
    const errorMessage = document.getElementById('errorMessage');

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
                transcriptContent.textContent = data.transcript;
                resultDiv.classList.remove('hidden');
            }
        } catch (error) {
            showError('An error occurred while fetching the transcript');
        } finally {
            loadingDiv.classList.remove('active');
        }
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