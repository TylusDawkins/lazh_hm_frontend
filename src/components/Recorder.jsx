import { onMount } from "solid-js";

import { createSignal, onCleanup } from "solid-js";

export default function Recorder() {
  const [recording, setRecording] = createSignal(false);
  const [audioUrl, setAudioUrl] = createSignal(null);

  let mediaRecorder;
  let audioChunks = [];
  let stream;

  const startRecording = async () => {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      setAudioUrl(URL.createObjectURL(audioBlob));
      audioChunks = [];
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    stream.getTracks().forEach((track) => track.stop());
    setRecording(false);
  };

  const handleRecording = () => {
    if(recording()) {
      stopRecording();
    } else {
        startRecording();
    }
  };

  onCleanup(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
    stream?.getTracks().forEach((track) => track.stop());
  });

  return (
    <div>
      {/* <button onClick={startRecording} disabled={recording()}>Start Recording</button>
      <button onClick={stopRecording} disabled={!recording()}>Stop Recording</button> */}
      <button onClick={handleRecording}>{recording() ? "Mute" : "Unmute" }</button>
      <audio controls src={audioUrl()} />
    </div>
  );
}
