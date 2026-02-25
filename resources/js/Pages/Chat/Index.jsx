import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Show from './Show';
import CreateGroup from './CreateGroup';

const Index = ({ auth, conversations, users }) => {
    const [conversationList, setConversationList] = useState(
        conversations || [],
    );
// console.log(conversationList);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [conversationId, setConversationId] = useState(null);
    const [sending, setSending] = useState(false);




    const [showGroupModal, setShowGroupModal] = useState(false);


    const { data, setData } = useForm({
        body: '',
        file: [],
    });

    /* ================= LOAD MESSAGES ================= */
    useEffect(() => {
        if (!selectedConversation) return;

        axios
            .get(`/chat/conversation/${selectedConversation.conversation_id}`)
            .then((res) => {
                setMessages(res.data.getmessages || []);
                setConversationId(res.data.conversation_id);
            })
            .catch(console.error);
    }, [selectedConversation]);

    /* ================= SEND MESSAGE ================= */
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!conversationId) return;

        try {
            setSending(true);

            const formData = new FormData();
            formData.append('body', data.body || '');

            if (data.file?.length > 0) {
                for (let i = 0; i < data.file.length; i++) {
                    formData.append('file[]', data.file[i]);
                }
            }

            const response = await axios.post(
                `/chat/${conversationId}/send`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } },
            );

            const newMessage = response.data.message;

            // Add message to chat
            setMessages((prev) => [...prev, newMessage]);

            // Move conversation to top
            setConversationList((prev) => {
                const updated = prev.filter(
                    (c) => c.conversation_id !== conversationId,
                );

                const current = prev.find(
                    (c) => c.conversation_id === conversationId,
                );

                if (!current) return prev;

                return [{ ...current, last_message: newMessage }, ...updated];
            });

            // Reset form
            setData({
                body: '',
                file: [],
            });
        } catch (error) {
            console.error(error);
    
            if (error.response) {
                if (error.response.status === 422) {
                    alert(error.response.data.error || "Message or file required");
                } else if (error.response.status === 403) {
                    alert("You are not allowed to send message.");
                } else {
                    alert("Server error. Please try again.");
                }
            } else {
                alert("Network error. Check your connection.");
            }
        }finally {
            setSending(false);
        }
    };

    /* ================= REALTIME ================= */
    useEffect(() => {
        if (!conversationId) return;

        const channel = window.Echo.private(`chat.${conversationId}`);

        channel.listen('.message.sent', (e) => {
            setMessages((prev) => [...prev, e.message]);

            setConversationList((prev) => {
                const updated = prev.filter(
                    (c) => c.conversation_id !== e.message.conversation_id,
                );

                const current = prev.find(
                    (c) => c.conversation_id === e.message.conversation_id,
                );

                if (!current) return prev;

                return [{ ...current, last_message: e.message }, ...updated];
            });
        });

        return () => {
            window.Echo.leave(`chat.${conversationId}`);
        };
    }, [conversationId]);
    /* ==================Start New Chat================ */
    const startChat = async (userId) => {
        try {
            const res = await axios.post(`/chat/start/${userId}`);
            const newConversationId = res.data.conversation_id;

            const exists = conversationList.find(
                (c) => c?.conversation_id === newConversationId,
            );

            if (exists) {
                setSelectedConversation(exists);
                return;
            }

            // Create a temporary conversation object
            const selectedUser = users.find((u) => u.id === userId);

            const newConversation = {
                conversation_id: newConversationId,
                is_group: false,
                users: [auth.user, selectedUser],
                last_message: null,
            };

            setConversationList((prev) => [newConversation, ...prev]);
            setSelectedConversation(newConversation);
        } catch (err) {
            console.error(err);
        }
    };
    /*Filter Exist Conversition======================== */
    const existingUserIds =
        conversationList
            ?.filter((c) => !c.is_group) // only private chats
            .flatMap((c) =>
                c.users?.filter((u) => u.id !== auth.user.id).map((u) => u.id),
            ) || [];

    /*========================createGroup======================= */
    
    return (
        <AuthenticatedLayout>
            {/* Create Group */}

            <div className="flex justify-end border-b bg-white p-3">
                <button
                    onClick={() => setShowGroupModal(true)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                    + Create Group
                </button>
            </div>

            <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-lg bg-white shadow">
                <div className="border-b p-4">
                    <div className="mb-2 font-semibold">Start New Chat</div>

                    {users
                        .filter((user) => !existingUserIds.includes(user.id))
                        .map((user) => (
                            <div
                                key={user.id}
                                onClick={() => startChat(user.id)}
                                className="cursor-pointer rounded p-2 hover:bg-gray-200"
                            >
                                {user.name}
                            </div>
                        ))}
                </div>
                {/* ================= CONVERSATION LIST ================= */}
                <div className="w-1/3 overflow-y-auto border-r bg-gray-50">
                    <div className="border-b p-4 font-semibold">
                        Conversations
                    </div>

                    {conversationList
                        ?.filter((c) => c && c.conversation_id)
                        .map((conversation) => (
                            <div
                                key={conversation.conversation_id}
                                onClick={() =>
                                    setSelectedConversation(conversation)
                                }
                                className={`cursor-pointer border-b p-4 hover:bg-gray-100 ${
                                    selectedConversation?.conversation_id ===
                                    conversation.conversation_id
                                        ? 'bg-gray-200'
                                        : ''
                                }`}
                            >
                                <div className="font-medium">
                                    {conversation.is_group
                                        ? conversation.name
                                        : conversation.users?.find(
                                              (u) => u.id !== auth.user.id,
                                          )?.name}
                                </div>

                                <div className="truncate text-sm text-gray-500">
                                    {conversation.last_message ? (
                                        conversation.is_group ? (
                                            <>
                                                <span className="font-medium">
                                                    {
                                                        conversation
                                                            .last_message.sender
                                                            ?.name
                                                    }
                                                    :
                                                </span>{' '}
                                                {conversation.last_message.body}
                                            </>
                                        ) : (
                                            conversation.last_message.body
                                        )
                                    ) : (
                                        'No messages yet'
                                    )}
                                </div>
                            </div>
                        ))}
                </div>

                {/* ================= CHAT BOX ================= */}
                <Show
                    selectedConversation={selectedConversation}
                    messages={messages}
                    auth={auth}
                    data={data}
                    setData={setData}
                    sendMessage={sendMessage}
                    processing={sending}
                />
            </div>

            {showGroupModal === true ? (
                <CreateGroup
                    users={users}
                    auth={auth}
                    setShowGroupModal={setShowGroupModal}
                    setConversationList={setConversationList}
                    showGroupModal={showGroupModal}
                    setSelectedConversation={setSelectedConversation}
                />
            ) : null}
        </AuthenticatedLayout>
    );
};

export default Index;
