import { useState } from "react";

const Show = ({
    selectedUser,
    messages,
    auth,
    data,
    setData,
    sendMessage,
    processing,
}) => {
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleFileChange = (e) => {
        const files = e.target.files;
        if (!files.length) return;

        setData((prev) => ({
            ...prev,
            images: files,
        }));

        if (files[0].type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(files[0]));
        } else {
            setPreviewUrl(null);
        }
    };
    console.log(messages);

    return (
        <div className="flex flex-1 flex-col">
            {selectedUser ? (
                <>
                    <div className="border-b bg-gray-100 p-4 font-semibold">
                        {selectedUser.name}
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50 p-4">
                        {messages.map((msg) => {
                            const isMine = msg.sender_id === auth.user.id;

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}
                                >
                                    <div
                                        className={`max-w-[75%] rounded-2xl ${
                                            isMine
                                                ? 'rounded-br-md bg-blue-500 text-white'
                                                : 'rounded-bl-md bg-gray-200 text-gray-900'
                                        } px-3 py-2 shadow-sm`}
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
                                                                <img
                                                                    src={`/storage/${file.file_path}`}
                                                                    alt="attachment"
                                                                    className="max-h-64 w-full rounded-xl object-cover"
                                                                />
                                                            ) : (
                                                                <a
                                                                    href={`/storage/${file.file_path}`}
                                                                    target="_blank"
                                                                    className="block rounded-lg bg-white/20 px-3 py-2 text-sm underline backdrop-blur"
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

                                        {/* Message Text */}
                                        {msg.body && (
                                            <p className="mt-2 break-words text-sm leading-relaxed">
                                                {msg.body}
                                            </p>
                                        )}

                                        {/* Timestamp (optional but recommended) */}
                                        <div className="mt-1 text-right text-[10px] opacity-70">
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
                    </div>

                    <form
                        onSubmit={sendMessage}
                        className="flex gap-2 border-t p-4"
                    >
                        {previewUrl && (
                            <div className="relative w-32">
                                <img
                                    src={previewUrl}
                                    className="rounded-lg border"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setData((prev) => ({
                                            ...prev,
                                            images: [],
                                        }));
                                        setPreviewUrl(null);
                                    }}
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
                            onChange={handleFileChange}
                        />

                        <label
                            htmlFor="fileInput"
                            className="cursor-pointer rounded-lg bg-gray-200 px-3 py-2"
                        >
                            📎
                        </label>

                        <input
                            type="text"
                            value={data.body}
                            onChange={(e) =>
                                setData((prev) => ({
                                    ...prev,
                                    body: e.target.value,
                                }))
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
                    Select a user to start chatting
                </div>
            )}
        </div>
    );
};


export default Show;