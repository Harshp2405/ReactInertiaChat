import { useState } from "react";

const AddMemberModal = ({
    users,
    selectedConversation,
    setShowAddModal,
    setConversationList,
    setMessages,
}) => {
    const [selectedUsers, setSelectedUsers] = useState([]);

    const existingIds = selectedConversation.users.map((u) => u.id);

    const handleAdd = async () => {
        if (selectedUsers.length === 0) return;

        try {
            const res = await axios.post(
                `/chat/${selectedConversation.conversation_id}/add-members`,
                { users: selectedUsers },
            );

            // Update members list
            setConversationList((prev) =>
                prev.map((c) =>
                    c.conversation_id === selectedConversation.conversation_id
                        ? res.data.conversation
                        : c,
                ),
            );

            setMessages((prev) => [...prev, res.data.message]);

            setShowAddModal(false);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
            <div className="w-96 rounded-xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-lg font-semibold">Add Members</h2>

                <div className="max-h-40 overflow-y-auto rounded border p-2">
                    {users
                        .filter((u) => !existingIds.includes(u.id))
                        .map((user) => (
                            <label key={user.id} className="flex gap-2 py-1">
                                <input
                                    type="checkbox"
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

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        onClick={() => setShowAddModal(false)}
                        className="rounded bg-gray-300 px-4 py-2"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        className="rounded bg-green-600 px-4 py-2 text-white"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddMemberModal;