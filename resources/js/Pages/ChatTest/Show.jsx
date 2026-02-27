// resources/js/Pages/ChatTest/Show.jsx
import { useChat } from '@/Context/ChatContext';
import axios from 'axios';
import { useState } from 'react';

export default function Show({ setShowAddModal }) {
    const {
        auth,
        selectedConversation,
        messages,
        setMessages,
        setConversationList,
        setSelectedConversation,
    } = useChat();

    const [body, setBody] = useState('');

    if (!selectedConversation) {
        return (
            <div className="flex flex-1 items-center justify-center text-gray-400">
                Select conversation
            </div>
        );
    }

    const sendMessage = async () => {
        if (!body.trim()) return;

        const res = await axios.post(
            `/chat/${selectedConversation.conversation_id}/send`,
            { body },
        );

        setMessages((prev) => [...prev, res.data.message]);
        setBody('');
    };



    return (
        <div className="flex flex-1 flex-col">
            {/* HEADER */}
            <div className="flex justify-between border-b p-4">
                <div>
                    <div className="font-semibold">
                        {selectedConversation.name}
                    </div>
                </div>

                {selectedConversation.is_group &&
                    auth.user.id === selectedConversation.createdby && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="rounded bg-green-500 px-3 py-1 text-white"
                        >
                            Add Member
                        </button>
                    )}
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
                {(messages || []).map((msg, index) => {
                    if (!msg) return null;

                    if (msg.type === 'system') {
                        return (
                            <div
                                key={msg.id || index}
                                className="my-2 text-center text-sm text-gray-500"
                            >
                                {msg.body}
                            </div>
                        );
                    }

                    const isMine = msg.sender_id === auth.user.id;

                    return (
                        <div
                            key={msg.id || index}
                            className={`mb-2 ${
                                isMine ? 'text-right' : 'text-left'
                            }`}
                        >
                            <div
                                className={`inline-block rounded px-3 py-2 ${
                                    isMine
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-300'
                                }`}
                            >
                                {msg.body}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* INPUT */}
            <div className="flex gap-2 border-t p-4">
                <input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="flex-1 rounded border px-3 py-2"
                />
                <button
                    onClick={sendMessage}
                    className="rounded bg-blue-500 px-4 text-white"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
