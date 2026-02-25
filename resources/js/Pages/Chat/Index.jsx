import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Show from './Show';
import { useForm } from '@inertiajs/react';



const Index = ({ auth, chatUser, conversations }) => {
    // console.log(conversations , "=================================");
    const [users, setUsers] = useState(chatUser || []);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [conversationId, setConversationId] = useState(null);
    const [sending, setSending] = useState(false);
    const { data, setData } = useForm({
        body: '',
        images: [],
    });

    /* ================= LOAD MESSAGES ================= */
    useEffect(() => {
        if (!selectedUser) return;

        axios
            .get(`/chat/${selectedUser.id}`)
            .then((res) => {
                setMessages(res.data.getmessages || []);
                setConversationId(res.data.conversation_id);
            })
            .catch((err) => console.error(err));
    }, [selectedUser]);

    /* ================= SEND MESSAGE ================= */
    const sendMessage = async (e) => {
    e.preventDefault();
    if (!conversationId) return;

    try {
        setSending(true);
        const formData = new FormData();

        // Append text
        formData.append('body', data.body || '');

        // Append files (multiple)
        if (data.images && data.images.length > 0) {
            for (let i = 0; i < data.images.length; i++) {
                formData.append('file[]', data.images[i]);
            }
        }

        const response = await axios.post(
            `/chat/${conversationId}/send`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        console.log(response.data)

        
        // Add new message instantly
        setMessages((prev) => [...prev, response.data.message]);
        

        setUsers((prevUsers) => {
            const updated = prevUsers.filter((u) => u.id !== selectedUser.id);

            return [selectedUser, ...updated];
        });

        console.log(data, " data================================");
        console.log(formData , "=======================Form Data");
        // Reset form
        setData((prev) => ({
            ...prev,
            body: '',
            images: [],
        }));

    } catch (error) {
        console.error(error);
    }finally{
        setSending(false);
    }
};


    useEffect(() => {
        if (!conversationId) return;

        window.Echo.private(`chat.${conversationId}`).listen(
            '.message.sent',
            (e) => {
                setMessages((prev) => [...prev, e.message]);

                
                setUsers((prevUsers) => {
                    const senderId = e.message.sender_id;

                    const updated = prevUsers.filter((u) => u.id !== senderId);

                    const senderUser = prevUsers.find((u) => u.id === senderId);

                    if (!senderUser) return prevUsers;

                    return [senderUser, ...updated];
                });
            },
        );

        return () => {
            window.Echo.leave(`private-chat.${conversationId}`);
        };
    }, [conversationId]);

    return (
        <AuthenticatedLayout
            
        >
            <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-lg bg-white shadow">
                {/* ================= USER LIST ================= */}
                <div className="w-1/3 overflow-y-auto border-r bg-gray-50">
                    <div className="border-b p-4 font-semibold">Users</div>

                    {users.map((user) => (
                        <div
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className={`cursor-pointer border-b p-4 hover:bg-gray-100 ${
                                selectedUser?.id === user.id
                                    ? 'bg-gray-200'
                                    : ''
                            }`}
                        >
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">
                                {user.email}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ================= CHAT BOX ================= */}
            
                <Show
                    selectedUser={selectedUser}
                    messages={messages}
                    auth={auth}
                    data={data}
                    setData={setData}
                    sendMessage={sendMessage}
                    processing={sending}
                />
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;
