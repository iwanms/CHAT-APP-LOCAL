import { React, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { FileInputIcon, X, Paperclip } from "lucide-react";
import { Image, Send } from "lucide-react";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);
  const fileDocInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Accept only allowed types
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/plain",
    ];
    if (!allowed.includes(file.type)) {
      toast.error("File type not supported");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview({
        name: file.name,
        data: reader.result,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setFilePreview(null);
    if (fileDocInputRef.current) fileDocInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !filePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        file: filePreview ? filePreview.data : undefined,
        fileName: filePreview ? filePreview.fileName : undefined,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (fileDocInputRef.current) fileDocInputRef.current.value = "";
    } catch (error) {
      console.log("Failed to send message: ", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {filePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex items-center border rounded px-2 py-1 bg-gray-100">
            <Paperclip className="mr-2 text-blue-600" size={18} />
            <span className="text-xs font-medium">{filePreview.name}</span>
            <button
              onClick={removeFile}
              className="ml-2 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`hidden sm:flex btn btn-circle ${
              imagePreview ? "text-emerald-500" : "text-zinc-400"
            }`}
          >
            <Image size={20} />
          </button>

          <input
            type="file"
            accept=".pdf,.doc,.docx,.xlsx,.xls,.txt"
            className="hidden"
            ref={fileDocInputRef}
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={() => fileDocInputRef.current?.click()}
            className="hidden sm:flex btn btn-circle text-zinc-400"
          >
            <Paperclip size={20} />
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview && !filePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
