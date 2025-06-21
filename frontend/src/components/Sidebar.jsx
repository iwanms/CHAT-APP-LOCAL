import React, { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Users } from "lucide-react";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { useAuthStore } from "../store/useAuthStore";

const Sidebar = () => {
  // const {
  //   getUsers,
  //   users,
  //   selectedUser,
  //   setSelectedUser,
  //   isUsersLoading,
  //   getUnreadCounts,
  //   unreadCounts,
  // } = useChatStore();

  const getUsers = useChatStore((state) => state.getUsers);
  const users = useChatStore((state) => state.users);
  const selectedUser = useChatStore((state) => state.selectedUser);
  const setSelectedUser = useChatStore((state) => state.setSelectedUser);
  const isUsersLoading = useChatStore((state) => state.isUsersLoading);
  const getUnreadCounts = useChatStore((state) => state.getUnreadCounts);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const rerender = useChatStore((state) => state.rerender); // Ambil state rerender
  const lastMessages = useChatStore((state) => state.messages);
  const lastMessagesMap = useChatStore((state) => state.lastMessages);
  const getLastMessages = useChatStore((state) => state.getLastMessages);

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  const [forceRender, setForceRender] = useState(false);

  useEffect(() => {
    console.log("unreadCounts", unreadCounts);
  }, [unreadCounts]);

  useEffect(() => {
    getUsers();
    getUnreadCounts();
    getLastMessages();

    // Cleanup function
    return () => {
      // Any cleanup if needed
    };
  }, [getUsers, getUnreadCounts, getLastMessages]);

  useEffect(() => {
    console.log("Current unread counts:", unreadCounts);
  }, [unreadCounts]);

  useEffect(() => {
    const unsubscribe = useChatStore.subscribe(
      (state) => state.unreadCounts,
      (unreadCounts) => {
        console.log("Unread counts updated:", unreadCounts);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 md:w-60 border-r  border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden md:block">Contacts</span>
        </div>
        <div className="mt-3 hidden md:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1} online)
          </span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => {
          const unread = unreadCounts[user._id] || 0;
          // Ambil pesan terakhir dari lastMessagesMap
          const lastMsg = lastMessagesMap[user._id];
          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
                selectedUser?._id === user._id
                  ? "bg-base-300 ring-1 ring-base-300"
                  : ""
              }`}
            >
              <div className="relative mx-auto md:mx-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.name}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                )}
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow">
                    {unread}
                  </span>
                )}
              </div>

              {/* User info - only visible on larger screens */}
              <div className="hidden md:block text-left min-w-0">
                <div className="font-medium truncate">{user.fullName}</div>
                {lastMsg && (
                  <div className="text-xs text-zinc-500 truncate mt-1 max-w-[140px]">
                    {lastMsg.text
                      ? lastMsg.text
                      : lastMsg.fileName
                      ? `📎 ${lastMsg.fileName}`
                      : lastMsg.image
                      ? "[Gambar]"
                      : ""}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
