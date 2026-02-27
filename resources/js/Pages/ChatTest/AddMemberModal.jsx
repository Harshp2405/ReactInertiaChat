import { useChat } from '@/Context/ChatContext';
import axios from 'axios';
import { useState } from 'react';

export default function AddMemberModal({ setShowAddModal }) {
    const { users, selectedConversation, setConversationList, setMessages } =
        useChat();

    const [selectedUsers, setSelectedUsers] = useState([]);

    const addMembers = async () => {
        const res = await axios.post(
            `/chat/${selectedConversation.conversation_id}/add-members`,
            { users: selectedUsers },
        );

        setConversationList((prev) =>
            prev.map((c) =>
                c.conversation_id === selectedConversation.conversation_id
                    ? res.data.conversation
                    : c,
            ),
        );

        setMessages((prev) => [...prev, res.data.message]);

        setShowAddModal(false);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
            <div className="w-96 rounded bg-white p-6">
                {users.map((user) => (
                    <label key={user.id} className="block">
                        <input
                            type="checkbox"
                            onChange={() =>
                                setSelectedUsers((prev) =>
                                    prev.includes(user.id)
                                        ? prev.filter((id) => id !== user.id)
                                        : [...prev, user.id],
                                )
                            }
                        />
                        {user.name}
                    </label>
                ))}

                <button
                    onClick={addMembers}
                    className="mt-3 rounded bg-green-500 px-3 py-2 text-white"
                >
                    Add
                </button>
            </div>
        </div>
    );
}
