import express from "express";
import { isAuthenticated } from "../middlewares/Auth.js";
import { multerUpload } from "../middlewares/multer.js"
import { newGroupChat, getMyChats, getMyGroups, addMembers, removeMembers, leaveGroup, sendAttachments, getChatDetails, renameGroup, deleteChat, getMessages } from "../controllers/chat.js";
import { addMembersValidator, deleteChatValidator, getChatDetailsValidator, getMessagesValidator, leaveGroupValidator, newGroupValidator, removeMembersValidator, renameValidator, sendAttachmentsValidator, validateHandler } from "../lib/validators.js";
const app = express.Router();

app.use(isAuthenticated);
app.post("/new", newGroupValidator(),validateHandler,newGroupChat);
app.get("/mychat", getMyChats);
app.get("/mygroup", getMyGroups);
app.put("/addmembers",addMembersValidator(),validateHandler, addMembers);
app.put("/removemembers", removeMembersValidator(),validateHandler,removeMembers);
app.delete("/leave/:id", leaveGroupValidator(),validateHandler,leaveGroup);
app.post("/message", multerUpload.array("files", 5),sendAttachmentsValidator(),validateHandler, sendAttachments);
app.get("/message/:id",getMessagesValidator(), validateHandler,getMessages)

app.route("/:id").get(getChatDetailsValidator(),validateHandler,getChatDetails).put(renameValidator(),validateHandler,renameGroup).delete(deleteChatValidator(),validateHandler,deleteChat);


export default app