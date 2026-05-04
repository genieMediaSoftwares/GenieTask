import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, push, set, onDisconnect } from "firebase/database";
import { FaTimes, FaUsers } from "react-icons/fa";

const MSG_COLORS = [
  "bg-purple-500","bg-green-500","bg-yellow-500","bg-red-500",
  "bg-blue-500","bg-indigo-500","bg-pink-500","bg-teal-500",
];

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

function getDmKey(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

export default function Messages() {
  const user    = auth.currentUser;
  const [myName] = (user?.displayName || "User|employee").split("|");

  const [messages,    setMessages]    = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [input,       setInput]       = useState("");
  const [showTeam,    setShowTeam]    = useState(false);
  const [recipient,   setRecipient]   = useState(null);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (!user) return;
    const onlineRef = ref(db, `online/${user.uid}`);
    set(onlineRef, { name: myName, uid: user.uid, lastSeen: Date.now() });
    onDisconnect(onlineRef).remove();
    return () => set(onlineRef, null);
  }, [user?.uid]);

  useEffect(() => {
    return onValue(ref(db, "users"), (snap) => {
      const data = snap.val() || {};
      setTeamMembers(
        Object.entries(data).map(([uid, v]) => ({
          uid,
          name: v.name || "Unknown",
          role: v.designation || v.role || "Team Member",
        }))
      );
    });
  }, []);

  useEffect(() => {
    return onValue(ref(db, "online"), (snap) => {
      setOnlineUsers(snap.val() || {});
    });
  }, []);

  useEffect(() => {
    const msgPath = recipient
      ? `messages/dm/${getDmKey(user.uid, recipient.uid)}`
      : "messages/team";

    return onValue(ref(db, msgPath), (snap) => {
      const data = snap.val() || {};
      setMessages(
        Object.entries(data)
          .map(([id, v]) => ({ id, ...v }))
          .sort((a, b) => a.timestamp - b.timestamp)
      );
    });
  }, [recipient?.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const msgPath = recipient
      ? `messages/dm/${getDmKey(user.uid, recipient.uid)}`
      : "messages/team";
    await push(ref(db, msgPath), {
      uid:       user.uid,
      name:      myName,
      message:   text,
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

  const selectRecipient = (member) => {
    setRecipient(member);
    setMessages([]);
    setShowTeam(false);
  };

  const onlineCount  = Object.keys(onlineUsers).length;
  const headerTitle  = recipient ? `DM · ${recipient.name}` : "Genie Media · Team Chat";
  const headerSub    = recipient
    ? (onlineUsers[recipient.uid] ? "🟢 Online now" : "⚫ Offline")
    : (onlineCount > 0 ? `${onlineCount} online` : "No one online");

  const others   = teamMembers.filter((m) => m.uid !== user.uid);
  const online   = others.filter((m) =>  onlineUsers[m.uid]);
  const offline  = others.filter((m) => !onlineUsers[m.uid]);

  const me = teamMembers.find((m) => m.uid === user.uid);

  const MemberRow = ({ m, isMe = false }) => {
    const isOnline   = !!onlineUsers[m.uid] || isMe;
    const isSelected = recipient?.uid === m.uid;

    return (
      <button
        onClick={() => !isMe && selectRecipient(m)}
        disabled={isMe}
        className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition text-left
          ${isMe       ? "bg-blue-50 cursor-default" : ""}
          ${isSelected ? "bg-purple-50" : ""}
          ${!isMe && !isSelected ? "hover:bg-slate-50 cursor-pointer" : ""}`}
      >
        <div className={`w-8 h-8 ${getAvatarColor(m.uid)} rounded-full flex items-center
          justify-center text-white text-xs font-bold shrink-0 relative`}>
          {initials(m.name)}
          {/* Online pulse ring */}
          {isOnline && (
            <span className="absolute inset-0 rounded-full animate-ping bg-green-400 opacity-20" />
          )}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white
            ${isOnline ? "bg-green-400" : "bg-slate-300"}`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium truncate
            ${isSelected ? "text-purple-700 font-semibold" : "text-slate-700"}`}>
            {m.name}
            {isMe && <span className="text-[10px] text-blue-500 ml-1">(you)</span>}
          </p>
          <p className="text-[11px] text-slate-400 truncate">{m.role}</p>
        </div>

        <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full
          ${isOnline
            ? "bg-green-100 text-green-600"
            : "bg-slate-100 text-slate-400"}`}>
          {isOnline ? "Online" : "Offline"}
        </span>
      </button>
    );
  };

  const TeamList = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
        <p className="text-[11px] font-semibold text-slate-400 tracking-widest uppercase">Team</p>
        <span className="flex items-center gap-1 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          <span className="text-green-500 font-medium">{onlineCount} online</span>
          <span className="text-slate-300 mx-0.5">/</span>
          <span className="text-slate-400">{teamMembers.length} total</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">

        <button
          onClick={() => selectRecipient(null)}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition text-left
            ${!recipient ? "bg-blue-50" : "hover:bg-slate-50"}`}
        >
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center
            justify-center text-white text-[10px] font-bold shrink-0">
            ALL
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-blue-700">Everyone</p>
            <p className="text-[11px] text-slate-400">Team channel</p>
          </div>
          <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full
            bg-blue-100 text-blue-500">
            #{onlineCount}
          </span>
        </button>

        <div className="border-t border-slate-100 my-1" />

        {me && <MemberRow m={me} isMe />}

        {online.length > 0 && (
          <>
            <p className="text-[10px] font-semibold text-green-500 tracking-widest uppercase px-2 pt-2 pb-0.5">
              🟢 Online — {online.length}
            </p>
            {online.map((m) => <MemberRow key={m.uid} m={m} />)}
          </>
        )}

        {offline.length > 0 && (
          <>
            <p className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase px-2 pt-3 pb-0.5">
              ⚫ Offline — {offline.length}
            </p>
            {offline.map((m) => <MemberRow key={m.uid} m={m} />)}
          </>
        )}

        {teamMembers.length === 0 && (
          <p className="text-xs text-slate-400 text-center mt-6 px-2">No team members yet.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex bg-white overflow-hidden
      h-[calc(100vh-52px)] mt-[52px]
      lg:h-screen lg:mt-0">

      <div className="hidden lg:flex w-60 border-r border-slate-100 flex-col shrink-0">
        <TeamList />
      </div>

      {showTeam && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setShowTeam(false)}
          />
          <div className="lg:hidden fixed top-[52px] left-0 bottom-0 w-64 bg-white z-50
            flex flex-col shadow-2xl border-r border-slate-100
            animate-[slideInLeft_0.25s_ease]">
            <button
              onClick={() => setShowTeam(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-slate-100
                hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
            >
              <FaTimes className="text-xs" />
            </button>
            <TeamList />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">

        <div className="px-3 sm:px-5 py-3 sm:py-3.5 border-b border-slate-100
          flex items-center gap-2 sm:gap-3 shrink-0">

          <button
            onClick={() => setShowTeam(true)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg
              bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0"
          >
            <FaUsers className="text-sm" />
          </button>

          {recipient ? (
            <div className={`w-8 h-8 sm:w-9 sm:h-9 ${getAvatarColor(recipient.uid)} rounded-xl
              flex items-center justify-center text-white text-sm font-bold shrink-0 relative`}>
              {initials(recipient.name)}
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white
                ${onlineUsers[recipient.uid] ? "bg-green-400" : "bg-slate-300"}`}
              />
            </div>
          ) : (
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-100 rounded-xl flex items-center
              justify-center text-base sm:text-lg shrink-0">
              💬
            </div>
          )}

          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
              {headerTitle}
            </h3>
            <p className={`text-[11px] font-medium
              ${headerSub.includes("Online") ? "text-green-500" : "text-slate-400"}`}>
              {headerSub}
            </p>
          </div>

          {recipient && (
            <button
              onClick={() => selectRecipient(null)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-medium transition"
            >
              <FaUsers className="text-xs" />
              Everyone
            </button>
          )}

          {!recipient && (
            <div className="hidden sm:flex items-center ml-auto gap-1">
              {Object.values(onlineUsers).slice(0, 4).map((u, i) => (
                <div
                  key={u.uid || i}
                  title={`${u.name} — Online`}
                  className={`w-7 h-7 ${getAvatarColor(u.uid)} rounded-full flex items-center
                    justify-center text-white text-[10px] font-bold border-2 border-white -ml-1 first:ml-0`}
                >
                  {initials(u.name)}
                </div>
              ))}
              {onlineCount > 4 && (
                <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center
                  text-slate-500 text-[10px] font-bold border-2 border-white -ml-1">
                  +{onlineCount - 4}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 sm:py-5 space-y-4 sm:space-y-5">
          {messages.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-3xl mb-2">{recipient ? "🔒" : "💬"}</p>
              <p className="text-sm">
                {recipient
                  ? `Start a private conversation with ${recipient.name}`
                  : "No messages yet. Say hi!"}
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.uid === user.uid;
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 sm:gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}
              >
                {!isMe && (
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 ${getAvatarColor(msg.uid)} rounded-full
                    flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {initials(msg.name)}
                  </div>
                )}
                <div className={`flex flex-col max-w-[72vw] sm:max-w-sm ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <p className="text-xs font-semibold text-purple-600 mb-1 ml-1">{msg.name}</p>
                  )}
                  <div className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-sm leading-relaxed break-words
                    ${isMe
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-700 rounded-bl-sm"
                    }`}>
                    {msg.message}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 mx-1">
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="px-3 sm:px-5 py-3 sm:py-3.5 border-t border-slate-100
          flex items-center gap-2 shrink-0">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={recipient ? `Message ${recipient.name}…` : "Message everyone…"}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-200 rounded-xl
              text-sm text-slate-700 placeholder-slate-300 bg-white
              focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40
              text-white rounded-xl flex items-center justify-center transition
              active:scale-90 text-base font-bold shrink-0"
          >
            →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}