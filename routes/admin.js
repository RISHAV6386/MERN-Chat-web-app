import express from "express";
import { adminLogin, adminLogout, getAdminData, getAllChats, getAllMessages, getAllUsers, getDahsboardStats } from "../controllers/admin.js";
import { adminLoginValidator, validateHandler } from "../lib/validators.js";
import { adminAuth } from "../middlewares/Auth.js";
const app = express.Router();

app.post("/verify",adminLoginValidator(),validateHandler,adminLogin)
app.get("/logout",adminLogout)
app.use(adminAuth)
app.get("/",getAdminData)
app.get("/users",getAllUsers)
app.get("/chats",getAllChats)
app.get("/messages",getAllMessages)
app.get("/stats",getDahsboardStats)


export default app