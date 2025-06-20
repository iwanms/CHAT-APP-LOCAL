import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
// import { getMessages } from "../../../backend/src/controllers/message.controller";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessageLoading: false,

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
    // console.log("selectedUser : " + selectedUser);
    // console.log("messages : " + messages);
    // console.log("messageData : " + messageData);

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

    socket.on("newMessage", (newMessage) => {
      // console.log("📥 New message received:", newMessage);

      try {
        const audio = new window.Audio("/notif.mp3");
        audio.play();
      } catch (error) {
        console.error("Error playing notification sound:", error);
      }

      const { selectedUser, messages, updateRead, getMessages, unreadCounts } =
        get();

      // console.log("SELECTED USER : " + selectedUser);

      if (selectedUser && selectedUser._id === newMessage.senderId) {
        set({ messages: [...messages, newMessage] });
        updateRead(selectedUser);
        getMessages(selectedUser._id);
      } else {
        if (!selectedUser) {
          // console.log("📭 No selectedUser, fetch fresh unreadCounts...");
          get().getUnreadCounts(); // tambahkan ini
        } else {
          set((state) => {
            const unread = {
              ...state.unreadCounts,
              [newMessage.senderId]:
                (state.unreadCounts[newMessage.senderId] || 0) + 1,
            };

            // console.log("🔴 Update unreadCounts:", unread);

            return { unreadCounts: unread };
          });
        }
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
      // console.log("UNSUBSCRIBE MESSAGES");
      socket.off("newMessage");
      socket.off("messagesRead");
    }
  },

  setSelectedUser: async (selectedUser) => {
    // console.log("selected user awal refresh : " + selectedUser);

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
      // console.log("set selected user null get lagi unread message");
      // Panggil getUnreadCounts kembali ketika selectedUser diatur menjadi null
      await get().getUnreadCounts();
      // set((state) => ({ rerender: !state.rerender }));
    }
  },

  // useChatStore.js
  updateRead: async (selectedUser) => {
    try {
      if (selectedUser?._id) {
        await axiosInstance.post(`/messages/read/${selectedUser._id}`, {
          read: 1,
        });
        // Tidak perlu update state messages atau unreadCounts di sini.
        // State messages sudah diupdate oleh socket event "messagesRead".
        // unreadCounts direset di setSelectedUser setelah updateRead berhasil.
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
      // console.log("🔄 Fetching unread counts...");
      const res = await axiosInstance.get("/messages/unread/counts");
      // console.log("✅ Unread counts response:", res.data);
      const countsMap = {};
      res.data.forEach((entry) => {
        countsMap[entry._id] = entry.count;
        // console.log(`   👤 User ID: ${entry._id}, Count: ${entry.count}`);
      });
      set({ unreadCounts: countsMap });
      // console.log("🔴 Updated unreadCounts in store:", get().unreadCounts);
    } catch (error) {
      console.error("❌ Failed to load unread messages:", error);
      toast.error("Failed to load unread messages");
    }
  },
}));
