import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessageLoading: false,
  popupMessage: null,
  lastMessages: {},

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;

    if (!socket || !authUser) {
      console.log("❗Socket atau authUser belum siap");
      return;
    }

    socket.off("newMessage");
    socket.off("messagesRead");

    socket.on("newMessage", async (newMessage) => {
      try {
        const audio = new window.Audio("/notif.mp3");
        audio.play();
      } catch (error) {
        console.error("Error playing notification sound:", error);
      }

      const {
        selectedUser,
        messages,
        updateRead,
        getMessages,
        unreadCounts,
        users,
      } = get();

      if (selectedUser && selectedUser._id === newMessage.senderId) {
        set({ messages: [...messages, newMessage] });
        updateRead(selectedUser);
        getMessages(selectedUser._id);
      } else {
        const senderUser = users.find((u) => u._id === newMessage.senderId);
        set({
          popupMessage: {
            ...newMessage,
            senderName: senderUser?.fullName || "Pesan Baru",
            profilePic: senderUser?.profilePic || "/avatar.png",
          },
        });
        if (!selectedUser) {
          get().getUnreadCounts();
        } else {
          set((state) => {
            const unread = {
              ...state.unreadCounts,
              [newMessage.senderId]:
                (state.unreadCounts[newMessage.senderId] || 0) + 1,
            };

            return { unreadCounts: unread };
          });
        }
      }

      if (get().getLastMessages) {
        await get().getLastMessages();
      }
    });

    socket.on("messagesRead", ({ readerId }) => {
      const authUser = useAuthStore.getState().authUser;
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.senderId === authUser._id && msg.receiverId === readerId
            ? { ...msg, read: 1 }
            : msg
        ),
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("messagesRead");
    }
  },

  setSelectedUser: async (selectedUser) => {
    set({ selectedUser });
    if (selectedUser?._id) {
      try {
        await get().updateRead(selectedUser);
        set((state) => {
          const updatedCounts = { ...state.unreadCounts };
          delete updatedCounts[selectedUser._id];
          return { unreadCounts: updatedCounts };
        });
      } catch (error) {
        console.error("Error updating read status:", error);
        toast.error(
          error.response?.data?.message || "Failed to update read status"
        );
      }
    } else {
      await get().getUnreadCounts();
    }
  },

  updateRead: async (selectedUser) => {
    try {
      if (selectedUser?._id) {
        await axiosInstance.post(`/messages/read/${selectedUser._id}`, {
          read: 1,
        });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update read status"
      );
    }
  },

  unreadCounts: {},
  getUnreadCounts: async () => {
    try {
      const res = await axiosInstance.get("/messages/unread/counts");
      const countsMap = {};
      res.data.forEach((entry) => {
        countsMap[entry._id] = entry.count;
      });
      set({ unreadCounts: countsMap });
    } catch (error) {
      console.error("❌ Failed to load unread messages:", error);
      toast.error("Failed to load unread messages");
    }
  },

  getLastMessages: async () => {
    try {
      const res = await axiosInstance.get("/messages/last-messages");
      const lastMessagesMap = {};
      res.data.forEach((msg) => {
        lastMessagesMap[msg.userId] = msg;
      });
      set({ lastMessages: lastMessagesMap });
    } catch (error) {
      toast.error("Failed to load last chat snippet");
    }
  },
}));
