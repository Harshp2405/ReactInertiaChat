import axios from 'axios';
import { Download, PaperclipIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const Show = ({
    selectedConversation,
    messages,
    auth,
    data,
    setData,
    sendMessage,
    processing,
    setConversationList,
    setSelectedConversation,
    setMessages,
    users,
    setShowAddModal,
}) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);

    const [showGroupInfo, setShowGroupInfo] = useState(false);

    // console.log(selectedConversation);

    /* Auto Scroll */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    /* Cleanup object URL on change/unmount */
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = (e) => {
        const files = e.target.files;
        if (!files.length) return;

        setData({
            ...data,
            file: files,
        });

        if (files[0].type.startsWith('image/')) {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(URL.createObjectURL(files[0]));
        } else {
            setPreviewUrl(null);
        }
    };

    const clearPreview = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setPreviewUrl(null);

        setData({
            ...data,
            body: '',
            file: [],
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        if (!data.body && (!data.file || data.file.length === 0)) {
            alert('Please enter a message or attach a file.');
            return;
        }

        e.preventDefault();
        await sendMessage(e);
        clearPreview();
    };

    /* =================================Leave Group ================================ */

    const handleLeaveGroup = async () => {
        if (!selectedConversation) return;

        if (!confirm('Are you sure you want to leave this group?')) return;

        try {
            if (auth.user.id === selectedConversation.createdby) {
                if (!confirm('Are you sure you want to delete this group?'))
                    return;
                await axios.delete(
                    `/chat/${selectedConversation.conversation_id}/delete`,
                );
            } else {
                await axios.post(
                    `/chat/${selectedConversation.conversation_id}/leave`,
                );
            }

            // Remove group from sidebar
            setConversationList((prev) =>
                prev.filter(
                    (c) =>
                        c.conversation_id !==
                        selectedConversation.conversation_id,
                ),
            );
        } catch (err) {
            console.error(err);
            // alert('Failed to leave group');

            return;
        } finally {
            setSelectedConversation(null);
            setMessages([]);
            return;
        }
    };

    /*===================================Remove user===================================== */

    const handleRemoveMember = async (userId) => {
        if (!confirm('Remove this member?')) return;

        try {
            const res = await axios.post(
                `/chat/${selectedConversation.conversation_id}/remove-member`,
                { user_id: userId },
            );

            // Update member list in conversationList
            setConversationList((prev) =>
                prev.map((c) =>
                    c.conversation_id === selectedConversation.conversation_id
                        ? {
                              ...c,
                              users: c.users.filter((u) => u.id !== userId),
                          }
                        : c,
                ),
            );

            // Add system message
            setMessages((prev) => [...prev, res.data.message]);
            console.log(userId, ' Remove');
        } catch (err) {
            console.error(err);
            alert('Failed to remove member');
        } finally {
            setShowGroupInfo(false);
            return;
        }
    };

    return (
        <div className="flex flex-1 flex-col">
            {selectedConversation ? (
                <>
                    {/* Header */}
                    <div className="border-b bg-gray-100 p-4">
                        <div className="flex items-center justify-between border-b bg-gray-100 p-4">
                            <div
                                onClick={() =>
                                    selectedConversation.is_group
                                        ? (console.log(selectedConversation),
                                          setShowGroupInfo(true))
                                        : ' '
                                }
                                className="cursor-pointer"
                            >
                                <div className="font-semibold">
                                    {selectedConversation.name}
                                </div>

                                {selectedConversation.is_group && (
                                    <div>
                                        {auth.user.id ===
                                        selectedConversation.createdby
                                            ? 'Admin'
                                            : 'Created By: ' +
                                              selectedConversation.users.find(
                                                  (u) =>
                                                      u.id ===
                                                      selectedConversation.createdby,
                                              )?.name}
                                    </div>
                                )}

                                {selectedConversation.is_group && (
                                    <div className="text-xs text-gray-500">
                                        {selectedConversation.users
                                            ?.map((u) => u.name)
                                            .join(', ')}
                                    </div>
                                )}
                            </div>

                            {selectedConversation.is_group && (
                                <div className="flex gap-2">
                                    {auth.user.id ===
                                        selectedConversation.createdby && (
                                        <button
                                            onClick={() => {
                                                setShowAddModal(true);
                                            }}
                                            className="rounded bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
                                        >
                                            Add Member to Group
                                        </button>
                                    )}

                                    <button
                                        onClick={handleLeaveGroup}
                                        className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                                    >
                                        Leave Group
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Messages */}

                    <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50 p-4">
                        {messages.map((msg) => {
                            if (msg.type === 'system') {
                                return (
                                    <div
                                        key={msg.id}
                                        className="my-2 text-center text-sm text-gray-500"
                                    >
                                        {msg.body}
                                    </div>
                                );
                            }

                            const isMine = msg.sender_id === auth.user.id;

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${
                                        isMine ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                    <div
                                        className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
                                            isMine
                                                ? 'rounded-br-md bg-blue-500 text-white'
                                                : 'rounded-bl-md bg-gray-500 text-gray-200'
                                        }`}
                                    >
                                        {/* Attachments */}
                                        {msg.attachments?.length > 0 && (
                                            <div className="space-y-2">
                                                {msg.attachments.map((file) => {
                                                    const isImage =
                                                        file.file_type?.startsWith(
                                                            'image/',
                                                        );

                                                    return (
                                                        <div key={file.id}>
                                                            {isImage ? (
                                                                <a
                                                                    href={`/storage/${file.file_path}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="block"
                                                                >
                                                                    <img
                                                                        src={`/storage/${file.file_path}`}
                                                                        alt="attachment"
                                                                        className="max-h-64 w-full rounded-xl object-cover"
                                                                    />
                                                                    <Download
                                                                        className="ml-2 inline-block"
                                                                        size={
                                                                            16
                                                                        }
                                                                    ></Download>{' '}
                                                                    Download
                                                                    file
                                                                </a>
                                                            ) : (
                                                                <a
                                                                    href={`/storage/${file.file_path}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="block rounded-lg bg-white/20 px-3 py-2 text-sm underline"
                                                                >
                                                                    📎 Download
                                                                    file
                                                                </a>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Text */}
                                        {msg.body && (
                                            <p className="mt-2 break-words text-sm">
                                                {msg.body}
                                            </p>
                                        )}

                                        {/* Time */}
                                        <div className="mt-1 flex justify-between text-right text-[10px] opacity-70">
                                            {/* Sender Name (only group & not mine) */}
                                            {selectedConversation.is_group &&
                                                !isMine && (
                                                    <div className="mb-1 ml-1 text-xs font-semibold text-gray-300">
                                                        {msg.sender?.name}
                                                    </div>
                                                )}
                                            {new Date(
                                                msg.created_at,
                                            ).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <div ref={bottomRef}></div>
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={handleSubmit}
                        className="flex gap-2 border-t p-4"
                    >
                        {previewUrl && (
                            <div className="relative w-32">
                                <img
                                    src={previewUrl}
                                    className="rounded-lg border"
                                    alt="preview"
                                />
                                <button
                                    type="button"
                                    onClick={clearPreview}
                                    className="absolute right-1 top-1 rounded bg-red-500 px-2 text-white"
                                >
                                    X
                                </button>
                            </div>
                        )}

                        <input
                            type="file"
                            multiple
                            hidden
                            id="fileInput"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />

                        <label
                            htmlFor="fileInput"
                            className="cursor-pointer rounded-lg bg-gray-200 px-3 py-2"
                        >
                            <PaperclipIcon className="h-5 w-5 text-center" />
                        </label>

                        <input
                            type="text"
                            value={data.body}
                            onChange={(e) =>
                                setData({
                                    ...data,
                                    body: e.target.value,
                                })
                            }
                            placeholder="Type a message..."
                            className="flex-1 rounded-lg border px-4 py-2"
                        />

                        <button
                            disabled={processing}
                            className="rounded-lg bg-blue-500 px-4 py-2 text-white"
                        >
                            Send
                        </button>
                    </form>
                </>
            ) : (
                <div className="flex flex-1 items-center justify-center text-gray-400">
                    Select a conversation to start chatting
                </div>
            )}

            {/* Group Info Modal */}
            {showGroupInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full rounded-lg bg-white p-6 md:w-1/2">
                        <h2 className="mb-4 text-xl font-bold">
                            {selectedConversation.name} - Group Info
                        </h2>

                        {/* CREATED BY */}
                        <p className="mb-4">
                            <strong>Admin:</strong>{' '}
                            {selectedConversation.users.find(
                                (u) => u.id === selectedConversation.createdby,
                            )?.name || 'Unknown'}
                        </p>

                        {/* MEMBERS LIST */}
                        <div className="mb-4">
                            <strong>Members:</strong>

                            <div className="mt-2 space-y-2">
                                {selectedConversation.users?.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between rounded border px-3 py-2"
                                    >
                                        <span>
                                            {user.name}
                                            {user.id ===
                                                selectedConversation.createdby &&
                                                ' (Admin)'}
                                        </span>

                                        {/* REMOVE BUTTON - ADMIN ONLY */}
                                        {auth.user.id ===
                                            selectedConversation.createdby &&
                                            user.id !== auth.user.id && (
                                                <button
                                                    onClick={() =>
                                                        handleRemoveMember(
                                                            user.id,
                                                        )
                                                    }
                                                    className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CLOSE BUTTON */}
                        <button
                            onClick={() => setShowGroupInfo(false)}
                            className="rounded bg-blue-500 px-3 py-2 text-white"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Show;
