import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId } from "../lib/socket.js";
import { io } from "../lib/socket.js";
import mongoose from "mongoose";
import axios from "axios";
import path from "path";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getUsersForSidebar controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, file, fileName } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let fileUrl;
    if (file) {
      const uploadResponse = await cloudinary.uploader.upload(file, {
        resource_type: "raw",
      });
      fileUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      file: fileUrl,
      fileName: fileName,
    });

    await newMessage.save();

    // tode: realtime functionality goes here => socket.io
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// message.controller.js
export const updateRead = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Validate IDs
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        error: "Receiver ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid receiver ID format",
      });
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId).select("_id");
    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: "Receiver user not found",
      });
    }

    // Update only unread messages
    const result = await Message.updateMany(
      {
        senderId: receiverId,
        receiverId: senderId,
        read: 0,
      },
      { $set: { read: 1 } }
    );

    // Socket notification
    const senderSocketId = getReceiverSocketId(receiverId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", {
        readerId: senderId,
        count: result.modifiedCount,
      });
    }

    res.status(200).json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Update read error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const getUnreadCounts = async (req, res) => {
  try {
    const myId = req.user._id;

    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiverId: new mongoose.Types.ObjectId(myId),
          read: 0,
        },
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json(unreadCounts);
  } catch (error) {
    console.log("Error in getUnreadCounts : " + error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// export const deleteManyMessages = async (req, res) => {
//   try {
//     const result = await Message.deleteMany({});
//   } catch (error) {
//     console.log(
//       "Error in func deleteManyMessages message.controller: ",
//       error.message
//     );
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// Proxy download endpoint
export const proxyDownload = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message || !message.file) {
      return res.status(404).json({ error: "File not found" });
    }
    const fileUrl = message.file;
    const fileName = message.fileName || "file";
    // Download file from Cloudinary
    const response = await axios.get(fileUrl, { responseType: "stream" });
    // Get extension from fileName
    const ext = path.extname(fileName);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      response.headers["content-type"] || "application/octet-stream"
    );
    response.data.pipe(res);
  } catch (error) {
    console.error("Proxy download error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
