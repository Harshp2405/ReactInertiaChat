import { usePage } from '@inertiajs/react';

export default function MessageBubble({ message }) {
    const user = usePage().props.auth.user;

    const isMine = message.sender_id === user.id;

    return (
        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-xs rounded-lg px-4 py-2 ${isMine ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
                {message.body}
            </div>
        </div>
    );
}
