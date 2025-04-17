import { createSignal, onCleanup, onMount } from "solid-js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function TranscriptLine(props) {
  const { line } = props;
  const [relative, setRelative] = createSignal(dayjs(line.start_timestamp).fromNow());

  // Update every 10 seconds, you can fine-tune
  let interval;
  onMount(() => {
    interval = setInterval(() => {
      setRelative(dayjs(line.start_timestamp).fromNow());
    }, 10000); // update every 10s
  });

  onCleanup(() => clearInterval(interval));

  return (
    <div class="transcript-line">
      <span class="timestamp">{relative()}</span>
      <strong>{line.player_id}:</strong> {line.text}
    </div>
  );
}
