// State Management
const state = {
    files: { face: null, audio: null, video: null },
    prompt: '',
    style: 'Cinematic 4K',
    isGenerating: false
};

// DOM Elements
const faceZone = document.getElementById('face-zone');
const audioZone = document.getElementById('audio-zone');
const videoZone = document.getElementById('video-zone');
const promptInput = document.getElementById('prompt-input');
const chips = document.querySelectorAll('.chip');
const generateBtn = document.getElementById('generate-btn');
const progressSection = document.getElementById('progress-section');
const outputSection = document.getElementById('output-section');
const progressFill = document.getElementById('progress-fill');
const progressStatus = document.getElementById('progress-status');
const outputVideo = document.getElementById('output-video');
const downloadBtn = document.getElementById('download-btn');
const gpuStatus = document.getElementById('gpu-status');
const statusDot = document.querySelector('.status-dot');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupUploadZones();
    setupPromptAndStyles();
    setupGeneration();
});

// 1. File Uploads
function setupUploadZones() {
    setupZone(faceZone, 'face-input', 'face');
    setupZone(audioZone, 'audio-input', 'audio');
    setupZone(videoZone, 'video-input', 'video');
}

function setupZone(zone, inputId, fileType) {
    const input = document.getElementById(inputId);
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
        e.preventDefault(); zone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0], zone, fileType);
    });
    input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0], zone, fileType);
    });
}

function handleFile(file, zone, fileType) {
    state.files[fileType] = file;
    zone.classList.add('has-file');
    zone.querySelector('.upload-text').textContent = file.name;
    zone.querySelector('.upload-sub').textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
}

// 2. Prompt & Styles
function setupPromptAndStyles() {
    promptInput.addEventListener('input', (e) => state.prompt = e.target.value);
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.style = chip.dataset.style;
        });
    });
}

// 3. Generation & Mock API
function setupGeneration() {
    generateBtn.addEventListener('click', startGeneration);
    downloadBtn.addEventListener('click', downloadVideo);
}

async function startGeneration() {
    if (state.isGenerating) return;
    if (!state.files.face || !state.files.audio) return alert('Please upload a face photo and reference audio.');
    if (!state.prompt) return alert('Please enter a scene prompt.');

    state.isGenerating = true;
    generateBtn.disabled = true;
    progressSection.classList.remove('hidden');
    outputSection.classList.add('hidden');
    
    // Reset progress UI
    document.querySelectorAll('.step').forEach(s => { s.classList.remove('active', 'completed'); s.querySelector('.step-indicator').textContent = s.id.split('-')[1].charAt(0).toUpperCase() + s.id.split('-')[1].slice(1,2); });
    progressFill.style.width = '0%';

    gpuStatus.textContent = 'GPU: CONNECTED';
    statusDot.classList.add('active');

    // Prepare FormData for Backend (Ready for Phase 2)
    const formData = new FormData();
    formData.append('face_image', state.files.face);
    formData.append('reference_audio', state.files.audio);
    if (state.files.video) formData.append('driving_video', state.files.video);
    formData.append('prompt', state.prompt);
    formData.append('style', state.style);

    /* 
    TODO: REAL API CALL (Uncomment in Phase 2)
    try {
        const response = await fetch('YOUR_NGROK_URL/api/generate', { method: 'POST', body: formData });
        const data = await response.json();
        // handle success
    } catch (error) { console.error(error); }
    */

    // Simulate Progress for UI Testing
    await simulatePipeline();
    state.isGenerating = false;
    generateBtn.disabled = false;
}

async function simulatePipeline() {
    const steps = [
        { id: 'step-voice', text: 'Cloning voice with F5-TTS...', duration: 2000, progress: 25 },
        { id: 'step-scene', text: 'Generating scene with InstantID & Wan2.1...', duration: 3000, progress: 60 },
        { id: 'step-sync', text: 'Syncing lips with LivePortrait...', duration: 2500, progress: 85 },
        { id: 'step-render', text: 'Rendering final MP4...', duration: 1500, progress: 100 }
    ];

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepEl = document.getElementById(step.id);
        stepEl.classList.add('active');
        progressStatus.textContent = step.text;
        animateProgress(step.progress, step.duration);
        await delay(step.duration);
        stepEl.classList.remove('active');
        stepEl.classList.add('completed');
        stepEl.querySelector('.step-indicator').textContent = '✓';
    }

    progressStatus.textContent = 'Generation complete!';
    showOutput();
}

function animateProgress(target, duration) {
    const start = parseFloat(progressFill.style.width) || 0;
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        progressFill.style.width = `${start + (target - start) * progress}%`;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function showOutput() {
    outputSection.classList.remove('hidden');
    // Placeholder video for UI testing
    outputVideo.src = 'https://www.w3schools.com/html/mov_bbb.mp4'; 
    outputVideo.load();
}

function downloadVideo() {
    const a = document.createElement('a');
    a.href = outputVideo.src;
    a.download = 'neuralcut_output.mp4';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
