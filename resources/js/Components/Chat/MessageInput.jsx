import axios from 'axios';
import { useState } from 'react';

export default function MessageInput({ conversation, setMessages }) {
    const [body, setBody] = useState('');

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!body.trim()) return;

        const res = await axios.post(
            `/chat/${conversation.conversation_id}/send`,
            { body },
        );

        setMessages((prev) => [...prev, res.data.message]);
        setBody('');
    };

    return (
        <form onSubmit={sendMessage} className="flex gap-2 border-t p-4">
            <input
                type="text"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="flex-1 rounded-lg border px-4 py-2"
                placeholder="Type a message..."
            />

            <button
                type="submit"
                className="rounded-lg bg-blue-500 px-4 py-2 text-white"
            >
                Send
            </button>
        </form>
    );
}
