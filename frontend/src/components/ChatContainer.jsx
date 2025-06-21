import { React, useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { FileText } from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    updateRead,
    users,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewPdf, setPreviewPdf] = useState(null);

  useEffect(() => {
    getMessages(selectedUser._id);
  }, [
    selectedUser._id,
    getMessages,
    // subscribeToMessages,
    // unsubscribeFromMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  useEffect(() => {
    console.log("Messages updated:", messages);
  }, [messages]);

  if (isMessagesLoading)
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      {/* Modal Preview Gambar */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative bg-white rounded shadow-lg p-4 max-w-full max-h-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[80vh] max-w-[90vw] rounded mb-4"
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
              onClick={() => setPreviewImage(null)}
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Back</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Preview PDF */}
      {previewPdf && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => setPreviewPdf(null)}
        >
          <div
            className="relative bg-white rounded shadow-lg p-4 max-w-full max-h-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <embed
              src={`/api/messages/preview/${previewPdf}`}
              type="application/pdf"
              className="max-h-[80vh] max-w-[90vw] rounded mb-4"
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
              onClick={() => setPreviewPdf(null)}
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Back</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
            ref={messageEndRef}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div
              className={`chat-bubble flex flex-col ${
                message.senderId != authUser._id
                  ? "bg-gray-300 text-gray-800"
                  : ""
              }`}
            >
              {message.image && (
                <div className="mb-2 flex flex-col items-start">
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-mb mb-1 cursor-pointer hover:opacity-80 transition"
                    onClick={() => setPreviewImage(message.image)}
                  />
                  <a
                    href={message.image}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 underline hover:text-blue-800 mt-1 flex items-center relative group"
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
                        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                      />
                    </svg>
                    <span className="absolute left-7 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      Save
                    </span>
                  </a>
                </div>
              )}
              {message.file && (
                <div className="mb-2 flex items-center gap-2">
                  <a
                    href={`/api/messages/download/${message._id}`}
                    className="flex items-center text-blue-600 hover:text-blue-800 underline gap-1"
                  >
                    <FileText className="h-5 w-5" />
                    <span>{message.fileName || "Download File"}</span>
                  </a>
                </div>
              )}
              {message.text && (
                <>
                  <p>{message.text}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs opacity-60">
                      {formatMessageTime(message.createdAt)}
                    </span>
                    {message.senderId === authUser._id && (
                      <svg
                        className={`h-4 w-4 ml-1 ${
                          message.read === 1 ? "text-blue-500" : "text-gray-500"
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
