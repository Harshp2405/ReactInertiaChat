import axios from 'axios';
import { useEffect, useState, useRef } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

export default function ChatWindow({ conversation }) {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (conversation) {
            axios
                .get(`/chat/${conversation.user.id}`)
                .then((res) => setMessages(res.data.messages));
        }
    }, [conversation]);

    if (!conversation) {
        return (
            <div className="flex flex-1 items-center justify-center text-gray-500">
                Select a conversation
            </div>
        );
    }

    const bottomRef = useRef(null);

    useEffect(() => {
        if (!conversation) return;

        const channel = window.Echo.private(
            `chat.${conversation.conversation_id}`,
        ).listen('MessageSent', (e) => {
            setMessages((prev) => [...prev, e.message]);
        });

        return () => {
            window.Echo.leave(`private-chat.${conversation.conversation_id}`);
        };
    }, [conversation]);

    return (
        <div className="flex flex-1 flex-col">
            {/* Header */}
            <div className="border-b p-4 font-semibold">
                {conversation.user.name}
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50 p-4">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
            </div>

            {/* Input */}
            <MessageInput
                conversation={conversation}
                setMessages={setMessages}
            />
        </div>
    );
}
