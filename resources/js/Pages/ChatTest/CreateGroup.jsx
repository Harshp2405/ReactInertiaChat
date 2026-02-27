import { useChat } from '@/Context/ChatContext';
import axios from 'axios';
import { useState } from 'react';

export default function CreateGroup({ setShowGroupModal }) {
    const { users, auth, setConversationList, setSelectedConversation } =
        useChat();
    const [name, setName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);

    const createGroup = async () => {
        const res = await axios.post("/chat/group/create",{
            name,
            users: selectedUsers,
        });

        const newConv = res.data.conversation;

        setConversationList((prev) => [newConv, ...prev]);
        setSelectedConversation(newConv);
        setShowGroupModal(false);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
            <div className="w-96 rounded bg-white p-6">
                <input
                    placeholder="Group Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mb-3 w-full border px-3 py-2"
                />

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
                    onClick={createGroup}
                    className="mt-3 rounded bg-blue-500 px-3 py-2 text-white"
                >
                    Create
                </button>
            </div>
        </div>
    );
}
