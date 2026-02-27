// src/Pages/Chat/Index.jsx
import { ChatProvider } from '@/Context/ChatContext';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ChatApp from './ChatApp'; 

const Index = ({ auth, conversations, users }) => {
    return (
        <AuthenticatedLayout>
            <ChatProvider
                auth={auth}
                users={users}
                initialConversations={conversations}
            >
                <ChatApp />
            </ChatProvider>
        </AuthenticatedLayout>
    );
};

export default Index;
