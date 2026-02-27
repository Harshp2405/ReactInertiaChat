import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import AddMemberModal from './AddMemberModal';
import CreateGroup from './CreateGroup';
import Show from './Show';

const Index = ({ auth, conversations, users }) => {
    const [conversationList, setConversationList] = useState(
        conversations || [],
    );
    // console.log(conversations);
    // console.log(users)

    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [conversationId, setConversationId] = useState(null);
    const [sending, setSending] = useState(false);

    const [showGroupModal, setShowGroupModal] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);

    const { data, setData } = useForm({
        body: '',
        file: [],
    });

    const navigate = () => {
        window.location.href = '/chats';
    };

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

    /* ==========================Sort Conversetion ============================ */

    const sortConversations = (list) => {
        return [...list].sort((a, b) => {
            const aTime = a.last_message?.created_at
                ? new Date(a.last_message.created_at).getTime()
                : 0;

            const bTime = b.last_message?.created_at
                ? new Date(b.last_message.created_at).getTime()
                : 0;

            return bTime - aTime; // newest first
        });
    };

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
                const newList = prev.map((c) =>
                    c.conversation_id === conversationId
                        ? { ...c, last_message: newMessage }
                        : c,
                );

                return sortConversations(newList);
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
                    alert(
                        error.response.data.error || 'Message or file required',
                    );
                } else if (error.response.status === 403) {
                    alert('You are not allowed to send message.');
                } else {
                    alert('Server error. Please try again.');
                }
            } else {
                alert('Network error. Check your connection.');
            }
        } finally {
            setSending(false);
        }
    };

    /*==============================  latest Chat ============================================== */
    useEffect(() => {
        if (!auth?.user?.id) return;

        /* ================= USER CHANNEL ================= */
        const userChannel = window.Echo.private(`user.${auth.user.id}`);

        userChannel.listen('.message.sent', (e) => {
            const newMessage = e.message;

            setConversationList((prev) => {
                let exists = false;

                const updated = prev.map((c) => {
                    if (c.conversation_id === newMessage.conversation_id) {
                        exists = true;
                        return {
                            ...c,
                            last_message: newMessage,
                        };
                    }
                    return c;
                });

                // If conversation not in sidebar (rare case)
                if (!exists) {
                    updated.unshift({
                        conversation_id: newMessage.conversation_id,
                        name: newMessage.sender?.name,
                        is_group: false,
                        users: [],
                        last_message: newMessage,
                    });
                }

                return sortConversations(updated);
            });

            // If this conversation is currently open → add message
            if (
                selectedConversation?.conversation_id ===
                newMessage.conversation_id
            ) {


                

                setMessages((prev) => {
                    const exists = prev.find((m) => m.id === newMessage.id);
                    if (exists) return prev;
                    return [...prev, newMessage];
                });
            }
        });

        /* ================= CLEANUP ================= */
        return () => {
            window.Echo.leave(`user.${auth.user.id}`);
        };
    }, [auth.user.id, selectedConversation]);

    /* ========================================Start New Chat================ */
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

    /*=======================================Filter Exist Conversition======================== */
    const existingUserIds =
        conversationList
            ?.filter((c) => !c.is_group) // only private chats
            .flatMap((c) =>
                c.users?.filter((u) => u.id !== auth.user.id).map((u) => u.id),
            ) || [];

    /*========================createGroup======================= */
    useEffect(() => {
        if (!conversationId) return;

        const channel = window.Echo.private(`chat.${conversationId}`);

        channel.listen('.message.sent', (e) => {

            const newMessage = e.message;


            setMessages((prev) => {
                // Prevent duplicate by ID check
                const exists = prev.find((m) => m.id === e.message.id);
                if (exists) return prev;

                return [...prev, e.message];
            });

            setConversationList((prev) => {
                const newList = prev.map((c) =>
                    c.conversation_id === e.message.conversation_id
                        ? { ...c, last_message: e.message }
                        : c,
                );

                return sortConversations(newList);
            });
            if (newMessage.sender_id !== auth.user.id) {
                axios.post(`/conversations/${newMessage.conversation_id}/read`);
            }
        });

        // Double tick logic

        channel.listen('.message.read', (e) => {

            setMessages((prev) =>
                prev.map((msg) =>
                    msg.sender_id === auth.user.id && !msg.read_at
                        ? { ...msg, read_at: new Date().toISOString() }
                        : msg,
                ),
            );
        });

        return () => {
            window.Echo.leave(`chat.${conversationId}`);
        };
    }, [conversationId]);

    /* ==================================Delete Group=================================== */

    const handleDeleteGroup = async (id) => {
        if (!confirm('Are you sure you want to delete this group?')) return;

        alert('Group deleted successfully');

        try {
            await axios.delete(`/chat/${id}/delete`);

            // Remove from sidebar
            setConversationList((prev) =>
                prev.filter((c) => c.conversation_id !== id),
            );
            navigate();
            setSelectedConversation(null);
            setMessages([]);
        } catch (err) {
            console.error(err);
            alert('Failed to delete group');
        }
    };

    /* =====================================Get Profile Image======================================== */

    const getConversationAvatar = (conversation) => {
        if (conversation.is_group) {
            return '/storage/profile_images/defaultimage/default.webp';
        }

        const otherUser = conversation.users?.find(
            (u) => u.id !== auth.user.id,
        );

        return otherUser?.profile_image
            ? `/storage/${otherUser.profile_image}`
            : '/storage/profile_images/defaultimage/default.webp';
    };

    return (
        <AuthenticatedLayout>
            {/* Create Group */}

            <div className="flex justify-between border-b bg-white p-3">
                <div>
                    {auth.user.profile_image !== null ? (
                        <img
                            src={`/storage/${auth.user.profile_image}`}
                            alt="Profile"
                            className="ml-2 inline-block h-8 w-8 rounded-full"
                        />
                    ) : (
                        <img
                            src={`/storage/profile_images/defaultimage/default.webp`}
                            alt="Profile"
                            className="ml-2 inline-block h-8 w-8 rounded-full"
                        />
                    )}
                </div>
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
                <div className="w-1/5 overflow-auto border-r bg-gray-50">
                    <div className="border-b p-4 font-semibold">
                        Conversations
                    </div>

                    {conversationList
                        ?.filter((c) => c && c.conversation_id)
                        .map((conversation) => (
                            <div
                                onClick={() =>
                                    setSelectedConversation(conversation)
                                }
                                key={conversation.conversation_id}
                                className={`flex flex-row justify-start gap-5 border-b p-2 ${
                                    // className={`grid grid-cols-12 gap-2 justify-between border-b p-4 ${
                                    selectedConversation?.conversation_id ===
                                    conversation.conversation_id
                                        ? 'bg-gray-300'
                                        : ''
                                }`}
                            >
                                <img
                                    src={getConversationAvatar(conversation)}
                                    alt="Profile"
                                    className="ml-2 inline-block h-8 w-8 rounded-full"
                                />
                                <div className="">
                                    <div className="cursor-auto">
                                        <div className="font-medium">
                                            {conversation.is_group
                                                ? conversation.name
                                                : conversation.users?.find(
                                                      (u) =>
                                                          u.id !== auth.user.id,
                                                  )?.name}
                                        </div>

                                        <div className="truncate text-sm text-gray-500">
                                            {conversation.last_message ? (
                                                conversation.is_group ? (
                                                    <>
                                                        <span className="font-medium">
                                                            {
                                                                conversation
                                                                    .last_message
                                                                    .sender
                                                                    ?.name
                                                            }
                                                            :
                                                        </span>{' '}
                                                        {
                                                            conversation
                                                                .last_message
                                                                .body
                                                        }
                                                    </>
                                                ) : (
                                                    conversation.last_message
                                                        .body
                                                )
                                            ) : (
                                                'No messages yet'
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-auto mr-5 flex items-center gap-2">
                                    {auth.user.id === conversation.createdby ? (
                                        <button
                                            onClick={() => {
                                                handleDeleteGroup(
                                                    conversation.conversation_id,
                                                );
                                                console.log(
                                                    `delete ${conversation.conversation_id}`,
                                                );
                                            }}
                                        >
                                            <Trash className="h-5 w-5 text-red-500" />
                                        </button>
                                    ) : (
                                        ''
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
                    setConversationList={setConversationList}
                    setSelectedConversation={setSelectedConversation}
                    setMessages={setMessages}
                    users={users}
                    setShowAddModal={setShowAddModal}
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

            {showAddModal && (
                <AddMemberModal
                    users={users}
                    setShowAddModal={setShowAddModal}
                    selectedConversation={selectedConversation}
                    setConversationList={setConversationList}
                    setMessages={setMessages}
                />
            )}
        </AuthenticatedLayout>
    );
};

export default Index;
