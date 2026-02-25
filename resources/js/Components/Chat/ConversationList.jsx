export default function ConversationList({
    conversations,
    selected,
    setSelected,
}) {
    return (
        <div className="w-80 overflow-y-auto border-r">
            {conversations.map((conv) => (
                <div
                    key={conv.conversation_id}
                    onClick={() => setSelected(conv)}
                    className={`cursor-pointer border-b p-4 hover:bg-gray-100 ${selected?.conversation_id === conv.conversation_id ? 'bg-gray-200' : ''}`}
                >
                    <div className="font-semibold">{conv.user.name}</div>
                    <div className="truncate text-sm text-gray-500">
                        {conv.last_message?.body}
                    </div>

                    {conv.unread_count > 0 && (
                        <span className="rounded-full bg-blue-500 px-2 py-1 text-xs text-white">
                            {conv.unread_count}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}
