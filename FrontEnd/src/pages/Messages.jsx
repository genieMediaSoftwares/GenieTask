import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, push, set, onDisconnect } from "firebase/database";

const MSG_COLORS = ["bg-purple-500", "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-blue-500", "bg-indigo-500", "bg-pink-500", "bg-teal-500"];

function getAvatarColor(uid) {
  const hash = [...(uid || "x")].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return MSG_COLORS[hash % MSG_COLORS.length];
}

function initials(name) {
  return (name || "U").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function Messages() {
  const user = auth.currentUser;
  const [myName] = (user?.displayName || "User|employee").split("|");

  const [messages, setMessages] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Mark current user as online
  useEffect(() => {
    if (!user) return;
    const onlineRef = ref(db, `online/${user.uid}`);
    set(onlineRef, {
      name: myName,
      uid: user.uid,
      lastSeen: Date.now(),
    });
    // Remove on disconnect
    onDisconnect(onlineRef).remove();
    return () => set(onlineRef, null);
  }, [user?.uid]);

  // Listen to all registered users from Firebase
  useEffect(() => {
    return onValue(ref(db, "users"), (snap) => {
      const data = snap.val() || {};
      const members = Object.entries(data).map(([uid, v]) => ({
        uid,
        name: v.name || "Unknown",
        role: v.designation || v.role || "Team Member",
      }));
      setTeamMembers(members);
    });
  }, []);

  // Listen to online presence
  useEffect(() => {
    return onValue(ref(db, "online"), (snap) => {
      setOnlineUsers(snap.val() || {});
    });
  }, []);

  // Listen to messages
  useEffect(() => {
    return onValue(ref(db, "messages/team"), (snap) => {
      const data = snap.val() || {};
      const msgs = Object.entries(data)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => a.timestamp - b.timestamp);
      setMessages(msgs);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await push(ref(db, "messages/team"), {
      uid: user.uid,
      name: myName,
      message: text,
      timestamp: Date.now(),
    });
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const onlineCount = Object.keys(onlineUsers).length;

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Team sidebar — real users from Firebase */}
      <div className="w-56 border-r border-slate-100 flex flex-col shrink-0">
        <div className="px-4 pt-5 pb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-slate-400 tracking-widest">TEAM</p>
          <span className="text-[11px] text-slate-400">{teamMembers.length} members</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {teamMembers.length === 0 ? (
            <p className="text-xs text-slate-400 text-center mt-6 px-2">
              No team members yet.
            </p>
          ) : (
            teamMembers.map((m) => {
              const isOnline = !!onlineUsers[m.uid];
              const isMe = m.uid === user.uid;
              return (
                <div
                  key={m.uid}
                  className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition
                    ${isMe ? "bg-blue-50" : "hover:bg-slate-50"}`}
                >
                  <div className={`w-8 h-8 ${getAvatarColor(m.uid)} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 relative`}>
                    {initials(m.name)}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white
                      ${isOnline ? "bg-green-400" : "bg-slate-300"}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {m.name} {isMe && <span className="text-[10px] text-blue-500">(you)</span>}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{m.role}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-lg">💬</div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Genie Media · Team Chat</h3>
            <p className="text-xs text-green-500 font-medium">
              {onlineCount > 0 ? `${onlineCount} online` : "No one online"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {messages.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm">No messages yet. Say hi!</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.uid === user.uid;
            return (
              <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                {!isMe && (
                  <div className={`w-8 h-8 ${getAvatarColor(msg.uid)} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {initials(msg.name)}
                  </div>
                )}
                <div className={`max-w-sm flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <p className="text-xs font-semibold text-purple-600 mb-1 ml-1">{msg.name}</p>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${isMe
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-700 rounded-bl-sm"
                    }`}>
                    {msg.message}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 mx-1">{formatTime(msg.timestamp)}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center gap-2 shrink-0">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700
              placeholder-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition active:scale-90 text-base font-bold"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}