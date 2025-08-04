import { TryCatch } from "../middlewares/Error.js";
import { User } from "../models/user.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { ErrorHandler } from "../utils/utility.js";
import jwt from "jsonwebtoken";
import { options } from "../utils/features.js";
import { adminSecretKey } from "../app.js";


const adminLogin = TryCatch(async (req, res, next) => {
    const { secretKey } = req.body;
    const isMatched = secretKey === adminSecretKey;
    if (!isMatched) return next(new ErrorHandler("Invalid Admin Key", 401));
    const token = jwt.sign(secretKey, process.env.JWT_SECRET);

    return res.status(200).cookie("Chat-admin-token", token, { ...options, maxAge: 1000 * 60 * 15 }).json({
        success: true,
        message: "Authenticated Successfully"
    })
})

const adminLogout = TryCatch(async (req, res, next) => {
   
    return res.status(200).cookie("Chat-admin-token", "", { ...options, maxAge:0 }).json({
        success: true,
        message: "Loggedout Successfully"
    })

})

const getAllUsers = TryCatch(async (req, res, next) => {
    const allUsers = await User.find({})
    const transformsAllUser = await Promise.all(allUsers.map(async ({ name, username, avatar, _id }) => {

        const [groups, friends] = await Promise.all([Chat.countDocuments({ groupChat: true, members: _id }), Chat.countDocuments({ groupChat: false, members: _id })])
        return { name, username, avatar: avatar.url, _id, groups, friends }
    }))


    return res.status(200).json({
        success: true,
        transformsAllUser

    })

})

const getAllChats = TryCatch(async (req, res, next) => {
    const chats = await Chat.find({}).populate("members", "name avatar").populate("creator", "name avatar")
    const transformchats = await Promise.all(chats.map(async ({ members, _id, groupChat, name, creator }) => {
        const totalMessages = await Message.countDocuments({ chat: _id })
        return {
            _id,
            groupChat,
            name,
            avatar: members.slice(0, 3).map((member) => (member.avatar.url)),
            members: members.map(({ _id, name, avatar }) => ({ _id, name, avatar: avatar.url })),
            creator: { name: creator?.name || "None", avatar: creator?.avatar.url || "" },
            totalMembers: members.length,
            totalMessages,
        }
    }))
    return res.status(200).json({
        success: true,
        chats: transformchats
    })
})

const getAllMessages = TryCatch(async (req, res, next) => {
    const allMessages = await Message.find({}).populate("sender", "name avatar").populate("chat", "groupChat")
    const transformMessages = allMessages.map(({ content, attachments, _id, sender, createdAt, chat }) => ({
        _id,
        //  attachments:attachments.map((i)=>i.url),
        attachments,
          content, createdAt,
        chat: chat._id,
        groupChat: chat.groupChat,
        sender: { _id: sender._id, name: sender.name, avatar: sender.avatar.url }
    }))
    return res.status(200).json({
        success: true,
        transformMessages
    })
})

const getDahsboardStats = TryCatch(async (req, res, next) => {

    const [groupsCount, usersCount, messagesCount, totalChatsCount] = await Promise.all([
        Chat.countDocuments({ groupChat: true }),
        User.countDocuments(),
        Message.countDocuments(),
        Chat.countDocuments()
    ]);

    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const last7DaysMessages = await Message.find({ createdAt: { $gte: last7Days, $lte: today } }).select("createdAt")
    const message = new Array(7).fill(0)
    last7DaysMessages.forEach(message => {
        const indexApprox = (today.getTime() - message.createdAt.getTime()) / (1000 * 24 * 60 * 60);
        const index = Math.floor(indexApprox);
        message[6 - index]++;
    })
    const stats = { groupsCount, usersCount, messagesCount, totalChatsCount, messagesChart: message }


    return res.status(200).json({
        success: true,
        stats
    })
})

const getAdminData=TryCatch(async(req,res,next)=>{
    return res.status(200).json({
        admin: true,
    })
})

export { getAllUsers, getAllChats, getAllMessages, getDahsboardStats, adminLogin,adminLogout,getAdminData }