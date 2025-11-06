/**
 * Video Export using Mediabunny
 * Simple canvas-to-MP4 export with Mediabunny library
 */

// Import Mediabunny from CDN
import { Output, Mp4OutputFormat, BufferTarget, CanvasSource, QUALITY_HIGH, QUALITY_MEDIUM, QUALITY_LOW } from 'https://cdn.skypack.dev/mediabunny@1.14.4';

// Ensure VideoExport is available immediately
window.VideoExport = window.VideoExport || {};

// Test Mediabunny import
console.log('🔧 Mediabunny import test:', {
    Output: typeof Output,
    Mp4OutputFormat: typeof Mp4OutputFormat,
    BufferTarget: typeof BufferTarget,
    CanvasSource: typeof CanvasSource,
    QUALITY_HIGH: typeof QUALITY_HIGH
});

// Global state for recording
let currentRecording = null;
let isExporting = false;

/**
 * Export canvas as MP4 video using Mediabunny
 * @param {Object} options - Export options
 * @param {HTMLCanvasElement} options.canvas - Canvas to export
 * @param {number} [options.durationSec=5] - Duration in seconds
 * @param {string} [options.quality='high'] - Quality: 'low', 'medium', 'high'
 * @param {Function} [options.onProgress] - Progress callback: (progress) => void
 */
async function exportCanvasToMP4({ canvas, durationSec = 15, quality = 'ultra', onProgress }) {
    console.log('🎬 Starting video export using MediaRecorder approach...');

    if (!canvas) {
        throw new Error('Canvas element is required');
    }

    if (isExporting) {
        throw new Error('Export already in progress');
    }

    isExporting = true;

    // Show progress UI
    showProgressUI();

    try {
        console.log('📊 Canvas info:', {
            width: canvas.width,
            height: canvas.height,
            hasContent: canvas.width > 0 && canvas.height > 0
        });

        // Check if canvas has content
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasContent = imageData.data.some(pixel => pixel !== 0);
        console.log('🎨 Canvas has content:', hasContent);

        // Determine quality settings (increased for better quality)
        const qualitySettings = {
            low: 2000000,    // 2 Mbps
            medium: 8000000, // 8 Mbps
            high: 16000000,  // 16 Mbps
            ultra: 32000000  // 32 Mbps
        };

        const bitrate = qualitySettings[quality] || qualitySettings.ultra;
        console.log('⚙️ Quality settings:', { quality, bitrate });

        // Create a temporary canvas for recording at fixed 1920x1080 resolution
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 1920;
        tempCanvas.height = 1080;
        const tempCtx = tempCanvas.getContext('2d');

        // Set up MediaRecorder - MP4 ONLY
        const mp4MimeTypes = [
            'video/mp4;codecs=avc1.42E01E',
            'video/mp4;codecs=avc1.4D001E',
            'video/mp4'
        ];

        let selectedMime = null;
        for (const mime of mp4MimeTypes) {
            if (MediaRecorder.isTypeSupported(mime)) {
                selectedMime = mime;
                break;
            }
        }

        if (!selectedMime) {
            throw new Error('MP4 export not supported in this browser. MP4 is required - no other formats accepted.');
        }

        console.log('🎬 Selected MIME type:', selectedMime);

        // Render first frame to ensure canvas has content before creating stream
        window.RenderPipeline.renderForExport(tempCtx, tempCanvas.width, tempCanvas.height, 0);
        
        // Wait a bit to ensure frame is rendered
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // Get canvas stream AFTER first frame is rendered
        console.log('🎥 Getting canvas stream...');
        const stream = tempCanvas.captureStream(60);
        console.log('✅ Canvas stream created');

        // Check if stream has video tracks
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length === 0) {
            throw new Error('Canvas stream has no video tracks. Screen recording may be interfering.');
        }
        console.log(`📹 Stream has ${videoTracks.length} video track(s)`);
        
        // Check track state
        const videoTrack = videoTracks[0];
        console.log('📹 Video track state:', {
            readyState: videoTrack.readyState,
            enabled: videoTrack.enabled,
            muted: videoTrack.muted
        });
        
        // Ensure track is enabled
        if (!videoTrack.enabled) {
            videoTrack.enabled = true;
            console.log('✅ Enabled video track');
        }

        const recorder = new MediaRecorder(stream, {
            mimeType: selectedMime,
            videoBitsPerSecond: bitrate
        });

        // Add error handler
        recorder.onerror = (event) => {
            console.error('❌ MediaRecorder error:', event.error);
            throw new Error(`MediaRecorder error: ${event.error?.message || 'Unknown error'}`);
        };

        const chunks = [];
        let hasReceivedData = false;
        
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
                hasReceivedData = true;
                console.log(`📦 Chunk received: ${event.data.size} bytes (total chunks: ${chunks.length})`);
            }
        };

        // Start recording
        console.log('🚀 Starting recording...');
        recorder.start(100); // Collect data every 100ms
        
        // Wait a moment to ensure recording has started
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (recorder.state !== 'recording') {
            throw new Error(`MediaRecorder failed to start. State: ${recorder.state}. Screen recording may be interfering.`);
        }
        console.log('✅ Recording started successfully');

        // Render animation frames at 60fps
        const fps = 60;
        const totalFrames = Math.floor(durationSec * fps);
        const frameInterval = 1000 / fps; // ~16.67ms per frame

        console.log(`🎬 Rendering ${totalFrames} frames at ${fps} FPS...`);

        const startTime = performance.now();

        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
            const tSec = frameIndex / fps;

            // Render the animation at this specific time
            window.RenderPipeline.renderForExport(tempCtx, tempCanvas.width, tempCanvas.height, tSec);

            // Wait for the frame to be rendered and captured
            // Use requestAnimationFrame to sync with browser's frame rate
            await new Promise(resolve => requestAnimationFrame(resolve));

            // Ensure we maintain 60fps timing
            const elapsed = performance.now() - startTime;
            const targetTime = frameIndex * frameInterval;
            const waitTime = Math.max(0, targetTime - elapsed);
            
            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }

            const progress = (frameIndex + 1) / totalFrames;
            updateProgress(progress);

            if (onProgress) {
                onProgress(progress);
            }

            // Log progress every 10% to reduce console spam
            if (frameIndex % Math.floor(totalFrames / 10) === 0 || frameIndex === totalFrames - 1) {
                console.log(`📈 Progress: ${Math.round(progress * 100)}%`);
            }
            
            // Check if we're receiving data periodically
            if (frameIndex > 0 && frameIndex % 60 === 0 && !hasReceivedData) {
                console.warn('⚠️ No data chunks received yet. Screen recording may be interfering.');
            }
        }

        // Stop recording
        console.log('🏁 Stopping recording...');
        
        // Request final data before stopping
        if (recorder.state === 'recording') {
            recorder.requestData();
        }
        
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout waiting for recorder to stop'));
            }, 5000);
            
            recorder.onstop = () => {
                clearTimeout(timeout);
                resolve();
            };
            
            recorder.onerror = (event) => {
                clearTimeout(timeout);
                reject(new Error(`MediaRecorder stop error: ${event.error?.message || 'Unknown error'}`));
            };
            
            recorder.stop();
        });

        console.log('✅ Recording stopped');

        // Create final blob
        const blob = new Blob(chunks, { type: selectedMime });
        console.log('📦 Final blob created:', {
            size: blob.size,
            type: blob.type,
            chunks: chunks.length,
            hasReceivedData: hasReceivedData
        });

        if (blob.size === 0) {
            const errorMsg = hasReceivedData 
                ? 'Generated video blob is empty despite receiving data chunks. Screen recording may be interfering with MediaRecorder.'
                : 'No data chunks received. MediaRecorder may not be capturing frames. Screen recording may be interfering.';
            throw new Error(errorMsg);
        }
        
        // Stop all video tracks to free resources
        videoTracks.forEach(track => {
            track.stop();
            console.log('🛑 Stopped video track');
        });

        // Download the file
        console.log('💾 Downloading file...');
        downloadVideo(blob, `momentum-type-${Date.now()}.mp4`);

        console.log('✅ MP4 export complete');
        showSuccess('MP4 exported successfully!');

    } catch (error) {
        console.error('❌ Video export failed:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        showError(`Video export failed: ${error.message}`);
    } finally {
        isExporting = false;
        hideProgressUI();
    }
}

/**
 * Start live recording using canvas stream
 * @param {Object} options - Recording options
 * @param {HTMLCanvasElement} options.canvas - Canvas to record
 * @param {number} [options.fps=30] - Frame rate
 * @param {string} [options.quality='high'] - Quality setting
 */
async function startLiveRecording({ canvas, fps = 60, quality = 'ultra' }) {
    if (!canvas) {
        throw new Error('Canvas element is required');
    }

    if (currentRecording) {
        throw new Error('Recording already in progress');
    }

    try {
        // Get canvas stream
        const stream = canvas.captureStream(fps);

        // Create MediaRecorder with MP4 support
        const mimeTypes = [
            'video/mp4;codecs=avc1.42E01E',
            'video/mp4;codecs=avc1.4D001E',
            'video/mp4',
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm'
        ];

        let selectedMime = null;
        for (const mime of mimeTypes) {
            if (MediaRecorder.isTypeSupported(mime)) {
                selectedMime = mime;
                break;
            }
        }

        if (!selectedMime) {
            throw new Error('No supported video MIME types found');
        }

        // Quality settings (increased for better quality)
        const qualitySettings = {
            low: 2000000,    // 2 Mbps
            medium: 8000000, // 8 Mbps
            high: 16000000,  // 16 Mbps
            ultra: 32000000  // 32 Mbps
        };

        const bitrate = qualitySettings[quality] || qualitySettings.ultra;

        // Create MediaRecorder
        const recorder = new MediaRecorder(stream, {
            mimeType: selectedMime,
            videoBitsPerSecond: bitrate
        });

        const chunks = [];

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        // Start recording
        recorder.start(1000); // Collect data every second

        currentRecording = {
            recorder,
            chunks,
            mime: selectedMime,
            stop: () => new Promise((resolve, reject) => {
                if (recorder.state === 'inactive') {
                    resolve({ blob: new Blob(chunks, { type: selectedMime }), mime: selectedMime });
                    return;
                }

                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: selectedMime });
                    resolve({ blob, mime: selectedMime });
                };

                recorder.onerror = (event) => {
                    reject(new Error(`MediaRecorder error: ${event.error}`));
                };

                recorder.stop();
            })
        };

        console.log(`Live recording started: ${selectedMime}`);
        return currentRecording;

    } catch (error) {
        console.error('Live recording failed:', error);
        throw error;
    }
}

/**
 * Stop live recording
 */
async function stopLiveRecording() {
    if (!currentRecording) {
        throw new Error('No recording in progress');
    }

    try {
        const { blob, mime } = await currentRecording.stop();

        // Download the file
        const extension = mime.includes('mp4') ? 'mp4' : 'webm';
        downloadVideo(blob, `momentum-type-live-${Date.now()}.${extension}`);

        console.log(`Live recording complete: ${mime}`);
        showSuccess(`Live recording exported successfully! (${mime})`);

        currentRecording = null;
        return { blob, mime };

    } catch (error) {
        console.error('Stop recording failed:', error);
        throw error;
    }
}

/**
 * Show progress UI
 */
function showProgressUI() {
    const progressElement = document.getElementById('exportProgress');
    if (progressElement) {
        progressElement.classList.remove('hidden');
        // Reset progress
        updateProgress(0);
    }
}

/**
 * Hide progress UI
 */
function hideProgressUI() {
    const progressElement = document.getElementById('exportProgress');
    if (progressElement) {
        progressElement.classList.add('hidden');
    }
}

/**
 * Update progress UI
 */
function updateProgress(progress) {
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');

    if (progressText) {
        progressText.textContent = `${Math.round(progress * 100)}%`;
    }
    if (progressFill) {
        progressFill.style.width = `${progress * 100}%`;
    }
}

/**
 * Show success message
 */
function showSuccess(message) {
    const successToast = document.getElementById('successToast');
    const successMessage = document.getElementById('successMessage');

    if (successToast && successMessage) {
        successMessage.textContent = message;
        successToast.classList.remove('hidden');

        setTimeout(() => {
            successToast.classList.add('hidden');
        }, 3000);
    }
}

/**
 * Show error message
 */
function showError(message) {
    const errorToast = document.getElementById('errorToast');
    const errorMessage = document.getElementById('errorMessage');

    if (errorToast && errorMessage) {
        errorMessage.textContent = message;
        errorToast.classList.remove('hidden');

        setTimeout(() => {
            errorToast.classList.add('hidden');
        }, 5000);
    }
}

/**
 * Download video blob
 */
function downloadVideo(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Check browser support
 */
function checkVideoSupport() {
    return {
        mediabunny: typeof Output !== 'undefined',
        mediaRecorder: !!window.MediaRecorder,
        canvasCapture: !!HTMLCanvasElement.prototype.captureStream,
        mp4: MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E'),
        webm: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    };
}

// Export functions for global access
window.VideoExport = {
    exportCanvasToMP4,
    startLiveRecording,
    stopLiveRecording,
    checkVideoSupport
};
