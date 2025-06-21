import React, { useEffect } from "react";
import Navbar from "./components/Navbar";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { Loader } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useChatStore } from "./store/useChatStore";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers, socket } =
    useAuthStore();
  const { theme } = useThemeStore();
  const subscribeToMessages = useChatStore(
    (state) => state.subscribeToMessages
  );
  const unsubscribeFromMessages = useChatStore(
    (state) => state.unsubscribeFromMessages
  );
  const popupMessage = useChatStore((state) => state.popupMessage);
  console.log("popupMessage", popupMessage);
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authUser && socket) {
      subscribeToMessages();
      return () => unsubscribeFromMessages();
    }
  }, [authUser, socket]);

  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }
  return (
    <div data-theme={theme} className="relative">
      {popupMessage && (
        <div className="fixed top-0 left-0 w-full flex justify-center z-[9999] pointer-events-auto">
          <div className="mt-6 bg-white shadow-lg rounded-lg p-4 border min-w-[280px] max-w-[90vw] flex flex-col items-center relative">
            <button
              onClick={() => useChatStore.setState({ popupMessage: null })}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
              aria-label="Tutup"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={popupMessage.profilePic || "/avatar.png"}
              alt={
                popupMessage.senderName ||
                popupMessage.senderFullName ||
                "Avatar"
              }
              className="w-12 h-12 rounded-full object-cover mb-2 border"
            />
            <div className="font-bold mb-1 text-black">
              {popupMessage.senderName ||
                popupMessage.senderFullName ||
                "Pesan Baru"}
            </div>
            <div className="text-sm text-black">
              {popupMessage.text || popupMessage.fileName || "[Gambar]"}
            </div>
          </div>
        </div>
      )}
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
        />
      </Routes>

      <Toaster />
    </div>
  );
};

export default App;
