"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { MessageSquare, Send, LogOut, Lock } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  image: string;
  department?: string;
  bio?: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sentCount, setSentCount] = useState<number>(0);
  const [textInput, setTextInput] = useState("");

  useEffect(() => {
    if (session) fetchUsers();
  }, [session]);

  useEffect(() => {
    if (selectedUser) fetchMessages(selectedUser.id);
  }, [selectedUser]);

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  };

  const fetchMessages = async (userId: string) => {
    const res = await fetch(`/api/messages?userId=${userId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
      setSentCount(data.sentCount);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !textInput.trim() || sentCount >= 2000) return;

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: selectedUser.id, content: textInput }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setSentCount(data.currentSentCount);
      setTextInput("");
    } else {
      const errorData = await res.json();
      alert(errorData.error);
    }
  };

  if (status === "loading") return <div className="p-10 text-center font-semibold">Loading...</div>;

  if (!session) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center space-y-6">
          <div className="bg-rose-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-rose-600">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">JU Campus Connect</h1>
          <p className="text-slate-600 text-sm">
            Strictly restricted to Jahangirnagar University accounts (@juniv.edu).
          </p>
          <button
            onClick={() => signIn("google")}
            className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl shadow transition"
          >
            Sign in with Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-screen flex flex-col p-4 md:p-6">
      <header className="flex justify-between items-center pb-4 mb-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="font-bold text-xl text-rose-600 flex items-center gap-2">
            <MessageSquare className="w-6 h-6" /> JU Dating
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-medium">
            {session.user?.email}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border">
            Sent Texts: <span className="font-bold text-slate-800">{sentCount}</span> / 2000
          </div>
          <button onClick={() => signOut()} className="text-slate-500 hover:text-slate-800 p-2">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
        <div className="bg-white border rounded-2xl p-4 overflow-y-auto space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider mb-2">Profiles</h2>
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className={`p-3 rounded-xl border cursor-pointer flex items-center space-x-3 ${
                selectedUser?.id === u.id ? "border-rose-500 bg-rose-50" : "border-slate-100"
              }`}
            >
              <img src={u.image || "https://via.placeholder.com/40"} alt={u.name} className="w-10 h-10 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">{u.name}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="md:col-span-2 bg-white border rounded-2xl flex flex-col h-full overflow-hidden">
          {selectedUser ? (
            <>
              <div className="p-4 border-b bg-slate-50 flex items-center space-x-3">
                <img src={selectedUser.image || "https://via.placeholder.com/40"} alt={selectedUser.name} className="w-10 h-10 rounded-full" />
                <h3 className="font-semibold text-slate-800 text-sm">{selectedUser.name}</h3>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.map((m) => {
                  const isMe = m.senderId === session.user?.id;
                  return (
                    <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${isMe ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                        {m.content}
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleSendMessage} className="p-3 border-t flex space-x-2 bg-white">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={sentCount >= 2000}
                  placeholder={sentCount >= 2000 ? "Message limit reached" : "Type a text-only message..."}
                  className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button type="submit" disabled={sentCount >= 2000 || !textInput.trim()} className="bg-rose-600 text-white p-2.5 rounded-xl">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 text-slate-400">Select a user to chat</div>
          )}
        </div>
      </div>
    </div>
  );
}
