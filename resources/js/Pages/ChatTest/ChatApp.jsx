// resources/js/Pages/ChatTest/ChatApp.jsx
import { useChat } from '@/Context/ChatContext';
import { useEffect, useState } from 'react';
import AddMemberModal from './AddMemberModal';
import CreateGroup from './CreateGroup';
import Show from './Show';

export default function ChatApp() {
    const {
        auth,
        users,
        conversationList,
        setConversationList,
        selectedConversation,
        setSelectedConversation,
        existingUserIds,
        startChat,
        loadMessages,
    } = useChat();
    const conversationId = selectedConversation?.conversation_id;
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    useEffect(() => {
        if (!conversationId) return;

        const channel = window.Echo.private(`chat.${conversationId}`);

        channel.listen('.message.sent', (e) => {
            if (e.message.conversation_id !== conversationId) return;

            setMessages((prev) => {
                const exists = prev.find((m) => m.id === e.message.id);
                if (exists) return prev;
                return [...prev, e.message];
            });

            setConversationList((prev) => {
                const updated = prev.map((c) =>
                    c.conversation_id === e.message.conversation_id
                        ? { ...c, last_message: e.message }
                        : c,
                );

                return updated.sort((a, b) => {
                    if (!a.last_message) return 1;
                    if (!b.last_message) return -1;

                    return (
                        new Date(b.last_message.created_at) -
                        new Date(a.last_message.created_at)
                    );
                });
            });
        });

        return () => {
            window.Echo.leave(`private-chat.${conversationId}`);
        };
    }, [conversationId]);



    useEffect(() => {
        if (!auth?.user?.id) return;

        const userChannel = window.Echo.private(`user.${auth.user.id}`);

        userChannel.listen('.group.created', (e) => {
            setConversationList((prev) => {
                const exists = prev.find(
                    (c) => c.conversation_id === e.conversation.id,
                );

                if (exists) return prev;

                return [
                    {
                        conversation_id: e.conversation.id,
                        name: e.conversation.name,
                        is_group: true,
                        users: e.conversation.users,
                        createdby: e.conversation.created_by,
                        last_message: null,
                    },
                    ...prev,
                ];
            });
        });

        return () => {
            window.Echo.leave(`private-user.${auth.user.id}`);
        };
    }, [auth?.user?.id]);



    return (
        <div className="flex h-screen">
            {/* LEFT SIDEBAR */}
            <div className="w-1/4 border-r bg-gray-50 p-4">
                <div className="mb-4 font-semibold">Start New Chat</div>

                {users
                    .filter((u) => !existingUserIds.includes(u.id))
                    .map((user) => (
                        <div
                            key={user.id}
                            onClick={() => startChat(user.id)}
                            className="cursor-pointer rounded p-2 hover:bg-gray-200"
                        >
                            {user.name}
                        </div>
                    ))}

                <hr className="my-4" />

                <div className="mb-2 font-semibold">Conversations</div>

                {conversationList.map((conv) => (
                    <div
                        key={conv.conversation_id}
                        onClick={() => {
                            setSelectedConversation(conv);
                            loadMessages(conv.conversation_id);
                        }}
                        className={`cursor-pointer rounded p-2 ${
                            selectedConversation?.conversation_id ===
                            conv.conversation_id
                                ? 'bg-gray-300'
                                : 'hover:bg-gray-200'
                        }`}
                    >
                        {conv.name}
                    </div>
                ))}

                <button
                    onClick={() => setShowGroupModal(true)}
                    className="mt-4 rounded bg-blue-500 px-3 py-2 text-white"
                >
                    Create Group
                </button>
            </div>

            {/* CHAT AREA */}
            <Show setShowAddModal={setShowAddModal} />

            {showGroupModal && (
                <CreateGroup setShowGroupModal={setShowGroupModal} />
            )}

            {showAddModal && (
                <AddMemberModal setShowAddModal={setShowAddModal} />
            )}
        </div>
    );
}
