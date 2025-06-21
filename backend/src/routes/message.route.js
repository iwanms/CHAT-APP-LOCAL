import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getUsersForSidebar,
  getMessages,
  sendMessage,
  updateRead,
  getUnreadCounts,
  proxyDownload,
  previewPdf,
  getLastMessagesForSidebar,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/last-messages", protectRoute, getLastMessagesForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.post("/read/:id", protectRoute, updateRead);

router.get("/unread/counts", protectRoute, getUnreadCounts);
router.get("/download/:messageId", proxyDownload);
router.get("/preview/:messageId", previewPdf);
// router.delete("/deleteMany", protectRoute, deleteManyMessages);

export default router;
