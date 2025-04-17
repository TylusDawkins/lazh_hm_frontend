import { createSignal, onCleanup, onMount, Show } from "solid-js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import './feed.css'

import Message from '@components/message/Message';

export default function Feed() {
    dayjs.extend(relativeTime);


    const [lines, setLines] = createSignal([]);

    let socket;

    onMount(() => {
        socket = new WebSocket("ws://localhost:8001/ws/transcript");

        socket.onmessage = (event) => {
            const incoming = JSON.parse(event.data);
            setLines(prev => {
                const index = prev.findIndex(line => line.start_timestamp === incoming.start_timestamp);
                if (index !== -1) {
                    // Replace existing line
                    const updated = [...prev];
                    updated[index] = incoming;
                    return [...updated].sort((a, b) => a.start_timestamp - b.start_timestamp);
                } else {
                    // Add new line
                    return [...prev, incoming];
                }
            });
            console.log([...lines()].sort((a, b) => a.start_timestamp - b.start_timestamp))
            window.feed = lines()
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
        <div class="main-container">
            <div class="main-content">
                {/* future controls or gameplay content */}
            </div>
            <div class="transcript-log">
                <Show when={lines().length === 0} fallback={
                    <For each={[...lines()].sort((a, b) => a.start_timestamp - b.start_timestamp)}>
                        {(line) => (
                            <div class="transcript-line">
                                <Message line={line} />
                            </div>
                        )}
                    </For>
                }>
                    <div class="no-dialogue">No dialogue history here</div>
                </Show>
            </div>
        </div>
    );

}