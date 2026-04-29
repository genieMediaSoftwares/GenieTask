import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, push, remove, update } from "firebase/database";
import { FaPlus, FaTimes, FaTrash } from "react-icons/fa";

export default function ItemLists() {
  const user = auth.currentUser;

  const [lists, setLists]               = useState([]);
  const [selectedId, setSelectedId]     = useState(null);
  const [newListTitle, setNewListTitle] = useState("");
  const [addingList, setAddingList]     = useState(false);
  const [newItem, setNewItem]           = useState("");

  useEffect(() => {
    if (!user) return;
    return onValue(ref(db, `itemLists/${user.uid}`), (snap) => {
      const data = snap.val() || {};
      const arr = Object.entries(data).map(([id, v]) => ({
        id,
        title: v.title || "Untitled",
        items: v.items
          ? Object.entries(v.items).map(([iid, iv]) => ({ id: iid, ...iv }))
          : [],
      }));
      setLists(arr);
      setSelectedId((prev) => prev ?? (arr[0]?.id || null));
    });
  }, [user?.uid]);

  const selectedList = lists.find((l) => l.id === selectedId) || null;

  const handleAddList = async () => {
    if (!newListTitle.trim()) return;
    const pushed = await push(ref(db, `itemLists/${user.uid}`), {
      title: newListTitle.trim(),
    });
    setSelectedId(pushed.key);
    setNewListTitle("");
    setAddingList(false);
  };

  const handleDeleteList = async (id, e) => {
    e.stopPropagation();
    await remove(ref(db, `itemLists/${user.uid}/${id}`));
    setSelectedId((prev) => (prev === id ? null : prev));
  };

  const handleAddItem = async () => {
    if (!newItem.trim() || !selectedId) return;
    await push(ref(db, `itemLists/${user.uid}/${selectedId}/items`), {
      text: newItem.trim(),
      done: false,
    });
    setNewItem("");
  };

  const handleToggleItem = async (itemId, done) => {
    await update(ref(db, `itemLists/${user.uid}/${selectedId}/items/${itemId}`), {
      done: !done,
    });
  };

  const handleDeleteItem = async (itemId) => {
    await remove(ref(db, `itemLists/${user.uid}/${selectedId}/items/${itemId}`));
  };

  const completedCount = selectedList?.items.filter((i) => i.done).length ?? 0;
  const totalCount     = selectedList?.items.length ?? 0;

  return (
    <div className="p-6 h-full">
      <h1 className="text-2xl font-bold text-slate-800 mb-5">Item Lists</h1>

      <div className="flex gap-5 h-[calc(100vh-160px)] min-h-[500px]">
        <div className="w-64 shrink-0 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">My Lists</span>
            <button
              onClick={() => setAddingList(true)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition"
            >
              <FaPlus className="text-xs" />
            </button>
          </div>

          {addingList && (
            <div className="px-3 py-2 border-b border-slate-100 flex gap-2">
              <input
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddList();
                  if (e.key === "Escape") { setAddingList(false); setNewListTitle(""); }
                }}
                placeholder="List name..."
                autoFocus
                className="flex-1 text-sm px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                onClick={handleAddList}
                className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <FaPlus className="text-xs" />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-1">
            {lists.length === 0 ? (
              <p className="text-xs text-slate-400 text-center mt-6 px-4">
                No lists yet. Click + to create one.
              </p>
            ) : (
              lists.map((list) => {
                const done  = list.items.filter((i) => i.done).length;
                const total = list.items.length;
                const isActive = list.id === selectedId;
                return (
                  <div
                    key={list.id}
                    onClick={() => setSelectedId(list.id)}
                    className={`group flex items-center justify-between px-4 py-3 cursor-pointer transition
                      ${isActive
                        ? "bg-blue-50 border-r-2 border-r-blue-600"
                        : "hover:bg-slate-50"
                      }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? "text-blue-700" : "text-slate-700"}`}>
                        {list.title}
                      </p>
                      {total > 0 && (
                        <p className="text-xs text-slate-400 mt-0.5">{done}/{total} done</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteList(list.id, e)}
                      className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-slate-400 hover:text-red-500 transition shrink-0"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          {!selectedList ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm">Select a list to get started</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-800 text-lg">{selectedList.title}</h2>
                  {totalCount > 0 && (
                    <span className="text-xs text-slate-400 font-medium">
                      {completedCount}/{totalCount} completed
                    </span>
                  )}
                </div>
                {totalCount > 0 && (
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${(completedCount / totalCount) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                {selectedList.items.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-2xl mb-2">✅</p>
                    <p className="text-sm">No items yet. Add one below.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {selectedList.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 px-5 py-3 group hover:bg-slate-50/60 transition"
                      >
                        <button
                          onClick={() => handleToggleItem(item.id, item.done)}
                          className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center transition
                            ${item.done
                              ? "bg-blue-600 border-blue-600"
                              : "border-slate-300 hover:border-blue-400"
                            }`}
                        >
                          {item.done && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                              <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>

                        <span className={`flex-1 text-sm transition ${item.done ? "line-through text-slate-400" : "text-slate-700"}`}>
                          {item.text}
                        </span>

                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition shrink-0"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-slate-100">
                <div className="flex gap-3">
                  <input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                    placeholder="Add a new item..."
                    className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                  />
                  <button
                    onClick={handleAddItem}
                    disabled={!newItem.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40
                      text-white text-sm font-medium rounded-xl transition active:scale-95"
                  >
                    Add
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}