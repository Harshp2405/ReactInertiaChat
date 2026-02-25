export default function AppLayout({ children }) {
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 p-4 text-white">
                <h2 className="mb-4 text-lg font-bold">Chat App</h2>
                <nav>
                    <a href="/dashboard" className="block py-2">
                        Dashboard
                    </a>
                    <a href="/chats" className="block py-2">
                        Chats
                    </a>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6">{children}</main>
        </div>
    );
}
