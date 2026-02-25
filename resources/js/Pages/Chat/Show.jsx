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
}) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);

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

    return (
        <div className="flex flex-1 flex-col">
            {selectedConversation ? (
                <>
                    {/* Header */}
                    <div className="border-b bg-gray-100 p-4">
                        <div className="text-lg font-semibold">
                            {selectedConversation.name}
                        </div>

                        {selectedConversation.is_group && (
                            <div className="mt-1 truncate text-sm text-gray-600">
                                {selectedConversation.users
                                    ?.map((user) => user.name)
                                    .join(', ')}
                            </div>
                        )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50 p-4">
                        {messages.map((msg) => {
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
        </div>
    );
};

export default Show;
