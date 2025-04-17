import { createSignal, onCleanup, onMount } from "solid-js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import Message from '@components/Message';

export default function Feed() {
    dayjs.extend(relativeTime);
    

    const [lines, setLines] = createSignal([]);

    let socket;

    onMount(() => {
        socket = new WebSocket("ws://localhost:8001/ws/transcript");

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("line 13: data: ", data)
            setLines(prev => [...prev, data]);
        };

        socket.onopen = () => {
            console.log("📡 WebSocket connected.");
        };

        socket.onclose = () => {
            console.warn("🛑 WebSocket disconnected.");
        };

        socket.onerror = (err) => {
            console.error("⚠️ WebSocket error:", err);
        };
    });

    onCleanup(() => {
        socket?.close();
    });

    return (
        <div class="transcript-log">
            <For each={lines()}>
                {(line) => (
                    <div class="transcript-line">
                        <Message line={line} />
                        {/* {dayjs(line.start_timestamp).fromNow()} <strong>{line.player_id}:</strong> {line.text} */}
                    </div>
                )}
            </For>
        </div>
    );
}