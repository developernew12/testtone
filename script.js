let mediaRecorder;
let audioChunks = [];
let waveSurfers = [];
let audioURLs = [];
let trackCount = 0;

const recordButton = document.getElementById("record-button");
const stopButton = document.getElementById("stop-button");
const playButton = document.getElementById("play-button");
const addTrackButton = document.getElementById("add-track");
const loopButton = document.getElementById("loop-button");
const exportButton = document.getElementById("export-button");
const trackContainer = document.getElementById("track-container");

let isRecording = false;
let isPlaying = false;
let isLooping = false;
let currentWaveSurfer = null;

loopButton.addEventListener("click", () => {
  isLooping = !isLooping;
  loopButton.innerHTML = isLooping
    ? '<i class="fa-solid fa-arrows-spin"></i> Looping'
    : '<i class="fa-solid fa-arrows-spin"></i>';
});

// Function to add audio enhancements to each WaveSurfer track
// Function to apply audio enhancements with reverb and balanced EQ
function applyAudioEnhancements(waveSurfer, index) {
  const reverb = waveSurfer.backend.ac.createConvolver();
  
  // Load an impulse response file for the reverb
  fetch("path/to/small-room-reverb-ir.wav")
    .then(response => response.arrayBuffer())
    .then(buffer => waveSurfer.backend.ac.decodeAudioData(buffer))
    .then(decodedData => {
      reverb.buffer = decodedData;
    });

  // Create a gain node
  const gainNode = waveSurfer.backend.ac.createGain();
  gainNode.gain.value = 1; // Ensure this is set to 1 for normal levels

  // Connect audio nodes
  waveSurfer.backend.gainNode.connect(gainNode);
  gainNode.connect(reverb);
  reverb.connect(waveSurfer.backend.ac.destination);
}


// Call applyAudioEnhancements when a new track is added
addTrackButton.addEventListener("click", () => {
  trackCount++;
  const trackElement = document.createElement("div");
  trackElement.classList.add("track");

  const trackLabel = document.createElement("div");
  trackLabel.classList.add("track-label");
  trackLabel.textContent = `Track ${trackCount}`;
  trackElement.appendChild(trackLabel);

  const waveformElement = document.createElement("div");
  waveformElement.classList.add("waveform");
  trackElement.appendChild(waveformElement);

  const removeButton = document.createElement("button");
  removeButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
  removeButton.classList.add("remove");

  removeButton.addEventListener("click", () => {
    const index = waveSurfers.indexOf(waveSurferInstance);
    waveSurfers.splice(index, 1);
    audioURLs.splice(index, 1);
    trackContainer.removeChild(trackElement);
  });

  trackElement.appendChild(removeButton);
  trackContainer.appendChild(trackElement);

  const waveSurferInstance = WaveSurfer.create({
    container: waveformElement,
    waveColor: "purple",
    progressColor: "black",
    height: 70,
  });

  waveSurfers.push(waveSurferInstance);
  currentWaveSurfer = waveSurferInstance;

  // Apply new audio enhancements to the track
  applyAudioEnhancements(waveSurferInstance, trackCount - 1);
});





recordButton.addEventListener("click", async () => {
  let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  waveSurfers.forEach((waveSurfer) => waveSurfer.play());

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
    const audioURL = URL.createObjectURL(audioBlob);
    audioURLs.push(audioURL);

    if (currentWaveSurfer) {
      currentWaveSurfer.load(audioURL);
    }

    playButton.disabled = false;
  };

  mediaRecorder.start();
  recordButton.disabled = true;
  stopButton.disabled = false;
  isRecording = true;
});

stopButton.addEventListener("click", () => {
  if (isRecording) {
    mediaRecorder.stop();
    waveSurfers.forEach((waveSurfer) => waveSurfer.stop());
    recordButton.disabled = false;
    stopButton.disabled = true;
    isRecording = false;
  } else if (isPlaying) {
    waveSurfers.forEach((waveSurfer) => waveSurfer.stop());
    isPlaying = false;
    stopButton.disabled = true;
  }
});

playButton.addEventListener("click", () => {
  waveSurfers.forEach((waveSurfer) => {
    waveSurfer.seekTo(0);
    waveSurfer.play();
    waveSurfer.on("finish", () => {
      if (isLooping) {
        waveSurfer.seekTo(0);
        waveSurfer.play();
      }
    });
  });
  isPlaying = true;
  stopButton.disabled = false;
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();

    if (isPlaying) {
      waveSurfers.forEach((waveSurfer) => waveSurfer.stop());
      isPlaying = false;
      stopButton.disabled = true;
    } else {
      waveSurfers.forEach((waveSurfer) => {
        waveSurfer.seekTo(0);
        waveSurfer.play();
      });
      isPlaying = true;
      stopButton.disabled = false;
    }
  }
});

exportButton.addEventListener("click", async () => {
  if (audioURLs.length === 0) return;

  const audioContext = new (window.OfflineAudioContext ||
    window.webkitOfflineAudioContext)(2, 44100 * 40, 44100);
  const sources = await Promise.all(
    audioURLs.map(async (url) => {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return audioContext.decodeAudioData(arrayBuffer);
    })
  );

  sources.forEach((buffer, index) => {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
  });

  audioContext.startRendering().then((renderedBuffer) => {
    const blob = new Blob([renderedBuffer.getChannelData(0)], {
      type: "audio/wav",
    });
    const exportURL = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = exportURL;
    downloadLink.download = "mixed_audio.wav";
    downloadLink.click();
  });
});
function addAnimation(button) {
  button.classList.add("animate__animated", "animate__jello");

  setTimeout(() => {
    button.classList.remove("animate__animated", "animate__jello");
  }, 1000);
}

const buttons = document.querySelectorAll("button");

buttons.forEach((button) => {
  button.addEventListener("click", () => addAnimation(button));
});
