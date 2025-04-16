import { createSignal, onCleanup, onMount } from "solid-js";
import { MediaRecorder, register } from 'extendable-media-recorder';
import { connect } from 'extendable-media-recorder-wav-encoder';

export default function Recorder() {
  const [recording, setRecording] = createSignal(false);
  const playerId = "player_123";

  let mediaRecorder;
  let stream;
  const MIN_BLOB_SIZE = 8000; // Skip blobs smaller than ~8 KB
  const RECORDING_DURATION = 2000; // 5 seconds

  const setupWavEncoder = async () => {
    try {
      await register(await connect());
      console.log("✅ WAV encoder connected successfully.");
    } catch (err) {
      console.error("❌ Failed to connect to WAV encoder:", err);
    }
  };

  const setupMedia = async () => {
    try {
      await setupWavEncoder();
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/wav' });
      console.log("✅ MediaRecorder initialized successfully.");
    } catch (err) {
      console.error("❌ Failed to initialize MediaRecorder:", err);
    }
  }


  const sendChunk = async (blob) => {
    console.log("SendChunk")
    try {
      if (blob.size < MIN_BLOB_SIZE) {
        console.warn("⛔ Skipping small or empty blob:", blob.size);
        return;
      }

      const formData = new FormData();
      formData.append("file", blob, `chunk-${Date.now()}.wav`);
      formData.append("player_id", playerId);
      formData.append("timestamp", Date.now());
      const res = await fetch("http://localhost:8000/upload-audio/", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      console.log("✅ Chunk sent:", json);
    } catch (err) {
      console.error("❌ Failed to send audio chunk:", err);
    }
  };

  let lastChunkSentTime = performance.now();

  function recordChunk() {
    // const audioContext = new AudioContext();
    // const mediaStreamAudioSourceNode = new MediaStreamAudioSourceNode(audioContext, { mediaStream: stream });
    // const mediaStreamAudioDestinationNode = new MediaStreamAudioDestinationNode(audioContext);

    // mediaStreamAudioSourceNode.connect(mediaStreamAudioDestinationNode);

    mediaRecorder.ondataavailable = (event) => {
      const now = Date.now();
      const delta = now - lastChunkSentTime;
      lastChunkSentTime = now;

      console.log(`🕓 Chunk duration since last: ${delta}ms`);
      if (event.data.size > 0) {
        sendChunk(event.data);
      }
    };

    mediaRecorder.start();

    setTimeout(() => {
      mediaRecorder.stop();  // triggers ondataavailable
      if (recording()) {
        recordChunk(); // recurse
      }
    }, 2000);
  }


  const startRecording = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // const audioContext = new AudioContext({ sampleRate: 16000 });
      // const mediaStreamAudioSourceNode = new MediaStreamAudioSourceNode(audioContext, { mediaStream: stream });
      // const mediaStreamAudioDestinationNode = new MediaStreamAudioDestinationNode(audioContext);

      // mediaStreamAudioSourceNode.connect(mediaStreamAudioDestinationNode);

      // const mediaRecorder = new MediaRecorder(mediaStreamAudioDestinationNode.stream);
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/wav' });

      recordChunk();

      mediaRecorder.ondataavailable = (event) => {
        if (recording()) {
          setTimeout(() => {
            mediaRecorder.stop();
          }, RECORDING_DURATION);
        }
        setTimeout(() => mediaRecorder.stop(), RECORDING_DURATION);
      };
      setRecording(true);
      console.log("🎤 Started recording.");
    } catch (err) {
      console.error("❌ Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    stream?.getTracks().forEach((track) => track.stop());
    setRecording(false);
    console.log("🛑 Stopped recording.");
  };

  const toggleRecording = () => {
    recording() ? stopRecording() : startRecording();
  };

  onCleanup(() => stopRecording());

  onMount(() => {
    setupMedia();
  });

  return (
    <div>
      <button onClick={toggleRecording}>
        {recording() ? "Mute Mic" : "Unmute Mic"}
      </button>
    </div>
  );
}
