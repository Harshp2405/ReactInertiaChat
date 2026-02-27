// resources/js/Context/ChatContext.jsx
import axios from 'axios';
import { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({
    auth,
    users,
    initialConversations,
    children,
}) => {
    const [conversationList, setConversationList] = useState(
        initialConversations || [],
    );
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);

    const existingUserIds = conversationList
        .filter((c) => !c.is_group)
        .flatMap((c) =>
            c.users?.filter((u) => u.id !== auth.user.id).map((u) => u.id),
        );

    // ✅ Start Private Chat
    const startChat = async (userId) => {
        const res = await axios.post(`/chat/start/${userId}`);
        const id = res.data.conversation_id;

        let existing = conversationList.find((c) => c.conversation_id === id);

        if (!existing) {
            const user = users.find((u) => u.id === userId);

            existing = {
                conversation_id: id,
                name: user.name,
                is_group: false,
                users: [auth.user, user],
                createdby: null,
                last_message: null,
            };

            setConversationList((prev) => [existing, ...prev]);
        }

        setSelectedConversation(existing);
        loadMessages(id);
    };

    // ✅ Load Messages
    const loadMessages = async (conversationId) => {
        try {
            const res = await axios.get(`/chat/conversation/${conversationId}`);
            setMessages(res.data.getmessages || []);
        } catch (error) {
            console.error('Load message error:', error);
            setMessages([]);
        }
    };

    return (
        <ChatContext.Provider
            value={{
                auth,
                users,
                conversationList,
                setConversationList,
                selectedConversation,
                setSelectedConversation,
                messages,
                setMessages,
                existingUserIds,
                startChat,
                loadMessages,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
