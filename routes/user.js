import express from "express";
import { acceptRequest, getMyFriends, getMyNotifications, getMyProfile, login, logout, newuser, searchUser, sendRequest } from "../controllers/user.js";
import { acceptRequestValidator, loginValidator, registerValidator, sendRequestValidator, validateHandler } from "../lib/validators.js";
import { isAuthenticated } from "../middlewares/Auth.js";
import { multerUpload } from "../middlewares/multer.js";
const app=express.Router();

app.post("/signup",multerUpload.single("avatar"),registerValidator(),validateHandler, newuser)
app.post("/login",loginValidator(),validateHandler,login)
app.use(isAuthenticated)
app.get("/profile",getMyProfile)
app.get("/logout",logout)
app.get("/search",searchUser)
app.put("/sendrequest",sendRequestValidator(),validateHandler,sendRequest)
app.put("/acceptrequest",acceptRequestValidator(),validateHandler,acceptRequest)
app.get("/notifications",getMyNotifications)
app.get("/friends",getMyFriends)

export default app