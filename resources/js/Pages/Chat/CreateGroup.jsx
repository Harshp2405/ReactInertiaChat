import React, { useState } from 'react'

const CreateGroup = ({
    users,
    auth,
    setConversationList,
    setShowGroupModal,
    showGroupModal,
    setSelectedConversation,
}) => {
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);

    const createGroup = async () => {
        if (!groupName || selectedUsers.length === 0) return;

        try {
            const res = await axios.post('/chat/group/create', {
                name: groupName,
                users: selectedUsers,
            });

            const newConversation = res.data.conversation;

            console.log(res);
            setConversationList((prev) => [newConversation, ...prev]);
            setSelectedConversation(newConversation);

            // Reset
            setGroupName('');
            setSelectedUsers([]);
            setShowGroupModal(false);
        } catch (err) {
            console.error(err);
        } finally {
            setShowGroupModal(false);
        }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="animate-fade-in w-96 rounded-xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-xl font-semibold">Create New Group</h2>

                {/* Group Name */}
                <input
                    type="text"
                    placeholder="Enter group name"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="mb-3 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                />

                {/* Users List */}
                <div className="mb-4 max-h-40 overflow-y-auto rounded-lg border p-2">
                    {users
                        .filter((u) => u.id !== auth.user.id)
                        .map((user) => (
                            <label
                                key={user.id}
                                className="flex items-center gap-2 py-1"
                            >
                                <input
                                    type="checkbox"
                                    value={user.id}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedUsers((prev) => [
                                                ...prev,
                                                user.id,
                                            ]);
                                        } else {
                                            setSelectedUsers((prev) =>
                                                prev.filter(
                                                    (id) => id !== user.id,
                                                ),
                                            );
                                        }
                                    }}
                                />
                                {user.name}
                            </label>
                        ))}
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setShowGroupModal(false)}
                        className="rounded-lg bg-gray-300 px-4 py-2 hover:bg-gray-400"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={createGroup}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroup