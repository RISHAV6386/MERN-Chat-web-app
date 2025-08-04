import { TryCatch } from "../middlewares/Error.js";
import { Chat } from "../models/chat.js";
import { deleteFilesFromClouinary, emitEvent, uploadFilesToClouinary } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";
import ALERT from "../constants/events.js"
import REFETCH_CHAT from "../constants/events.js"
import NEW_MESSAGE from "../constants/events.js"
import NEW_MESSAGE_ALERT from "../constants/events.js"
import { getOtherMember } from "../lib/helper.js";
import { User } from "../models/user.js";
import { Message } from "../models/message.js";


const newGroupChat = TryCatch(async (req, res, next) => {
    const { name, members } = req.body;

    if (members.length < 2) return next(new ErrorHandler("Group chat must have at least 3 members", 404));

    const allMembers = [...members, req.user];
    await Chat.create({
        name,
        groupChat: true,
        creator: req.user,
        members: allMembers,
    })

    emitEvent(req, "ALERT", allMembers, `Welcome to ${name} group`)
    emitEvent(req, "REFETCH_CHAT", allMembers)
    return res.status(201).json({
        success: true,
        message: "Group created"
    })
})
const getMyChats = TryCatch(async (req, res, next) => {
    const chats = await Chat.find({ members: req.user }).populate("members",);

    const transformChats = chats.map(({ _id, name, members, groupChat }) => {
        const otherMembers = getOtherMember(members, req.user);
        return {
            _id,
            groupChat,
            avatar: groupChat ? members.slice(0, 3).map(({ avatar }) => avatar.url) : [otherMembers.avatar.url],
            name: groupChat ? name : otherMembers.name,
            members: members.reduce((prev, curr) => {
                if (curr._id.toString() !== req.user.toString()) {
                    prev.push(curr._id)
                }
                return prev
            }, []),
        }
    })
    return res.status(200).json({
        success: true,
        chats: transformChats
    })
})

const getMyGroups = TryCatch(async (req, res, next) => {
    const chats = await Chat.find({ members: req.user, groupChat: true, creator: req.user }).populate("members", "name avatar");
    const groups = chats.map(({ members, _id, groupChat, name }) => ({
        _id,
        groupChat,
        name,
        avatar: members.slice(0, 3).map(({ avatar }) => avatar.url)
    }))

    return res.status(200).json({
        success: true,
        groups,
    })
})
const addMembers = TryCatch(async (req, res, next) => {
    const { members, chatId } = req.body
    console.log(members, chatId)
    if (!members || members.length < 1) return next(new ErrorHandler("Please provide members", 400))
    const chat = await Chat.findById(chatId)
    if (!chat) return next(new ErrorHandler("Chat not found", 404));
    if (!chat.groupChat) return next(new ErrorHandler("This is not a Group", 400));
    if (chat.creator.toString() !== req.user.toString()) return next(new ErrorHandler("You are not allowed to add members", 403))

    const allNewMembersPromise = members.map((i) => User.findById(i, "name"))
    const allNewMembers = await Promise.all(allNewMembersPromise)

    const uniqueMembers = allNewMembers.filter((i) => !chat.members.includes(i._id.toString())).map((i) => i._id);

    chat.members.push(...uniqueMembers.map((i) => i._id))
    if (chat.members.length > 50) return next(new ErrorHandler("Group members limit reached", 400));
    await chat.save();
    const allUserName = allNewMembers.map((i) => i.name).join(",");
    emitEvent(req, "ALERT", chat.members, `${allUserName} has been added in the group`)
    emitEvent(req, "REFETCH_CHAT", chat.members)



    return res.status(200).json({
        success: true,
        message: "Members added successfully",
    })
})

const leaveGroup = TryCatch(async (req, res, next) => {
    const chatId = req.params.id;
    const chat = await Chat.findById(chatId)
    if (!chat) return next(new ErrorHandler("Chat not found", 404));
    if (!chat.groupChat) return next(new ErrorHandler("This is not a Group", 400));

    const remainingMembers = chat.members.filter(
        (member) => member.toString() !== req.user.toString()
    )

    if (remainingMembers.length < 3) return next(new ErrorHandler("Group must have atleat 3 members", 400))
    if (chat.creator.toString() === req.user.toString()) {
        const newCreator = remainingMembers[0];
        chat.creator = newCreator;
    }
    chat.members = remainingMembers
    const user = Promise.all([User.findById(req.user.name), chat.save()])
    emitEvent(req, "ALERT", chat.members, {
        message:`${user} has left the group`,
        chatId,
    })
    return res.status(200).json({
        success: true,
        message: "Group Leaved"
    })

})
const removeMembers = TryCatch(async (req, res, next) => {
    const { userId, chatId } = req.body
    if (!userId || !chatId) return next(new ErrorHandler("Please provide userId and or chatId", 400))

    const [chat, removeUser] = await Promise.all([Chat.findById(chatId), User.findById(userId, "name")])
    if (!chat) return next(new ErrorHandler("Chat not found", 404));
    if (!chat.groupChat) return next(new ErrorHandler("This is not a Group", 400));
    if (chat.creator.toString() !== req.user.toString()) return next(new ErrorHandler("You are not allowed to remove yourself ", 403))
    if (chat.members.length <= 3) return next(new ErrorHandler("Group must have atleast 3 members", 400))

    const allChatMembers = chat.members.map((i) => i.toString())

    chat.members = chat.members.filter(
        (member) => member.toString() !== userId.toString())
    await chat.save()
    emitEvent(req, "ALERT", chat.members, {
        message:`${removeUser.name} has been removed from the group`,
        chatId,
    })
    emitEvent(req, "REFETCH_CHAT", allChatMembers)

    return res.status(200).json({
        success: true,
        message: "Member removed successfully"
    })

})

const sendAttachments = TryCatch(async (req, res, next) => {
    const { chatId } = req.body;
    const files = req.files || [];


    const [chat, user] = await Promise.all([Chat.findById(chatId), User.findById(req.user, "name")])
    if (!chat) return next(new ErrorHandler("Chat not found", 404));
    if (files.length < 1) return next(new ErrorHandler("Please provide attachments", 400));
    if (files.length > 5) return next(new ErrorHandler("Files can't be more than 5", 400));
    const attachments = await uploadFilesToClouinary(files);


    const messageForDb = { content: "", attachments, sender: user._id, chat: chatId }
    const messageForRealTime = { ...messageForDb, sender: { _id: user._id, name: user.name } };
    const message = await Message.create(messageForDb)

    emitEvent(req, "NEW_MESSAGE", chat.members, {
        message: messageForRealTime,
        chat: chatId
    })

    emitEvent(req, "NEW_MESSAGE_ALERT", chat.members, { chatId })
    return res.status(200).json({
        success: true,
        message,
    })

})
const getChatDetails = TryCatch(async (req, res, next) => {
    if (req.query.populate === "true") {
        const chat = await Chat.findById(req.params.id).populate("members", "name avatar").lean();
        if (!chat) return next(new ErrorHandler("Chat not found", 404));
        chat.members = chat.members.map(({ _id, name, avatar }) => ({ _id, name, avatar: avatar.url, }))
        return res.status(200).json({
            success: true,
            chat
        });
    } else {
        const chat = await Chat.findById(req.params.id);
        if (!chat) return next(new ErrorHandler("Chat not found", 404));

        return res.status(200).json({
            success: true,
            chat
        });
    }

})
const renameGroup = TryCatch(async (req, res, next) => {
    const chatId = req.params.id;
    const { name } = req.body
    const chat = await Chat.findById(chatId);
    if (!chat) return next(new ErrorHandler("Chat not found", 404));
    if (!chat.groupChat) return next(new ErrorHandler("This is not a Group", 400));
    if (chat.creator.toString() !== req.user.toString()) return next(new ErrorHandler("You are not allowed to rename the group", 403))
    chat.name = name;
    await chat.save();
    emitEvent(req, "REFETCH_CHAT", chat.members);
    return res.status(200).json({
        success: true,
        message: "Group renamed successfully"
    })
})

const deleteChat = TryCatch(async (req, res, next) => {
    const chatId = req.params.id;
    const chat = await Chat.findById(chatId);
    if (!chat) return next(new ErrorHandler("Chat not found", 404));
    const members = chat.members
    if (chat.groupChat && chat.creator.toString() !== req.user.toString()) return next(new ErrorHandler("You are not allowed to delete the group", 403))
    if (!chat.groupChat && !chat.members.includes(req.user.toString())) return next(new ErrorHandler("You are not allowed to delete the group", 403));
    const messagesWithFiles = await Message.find({ chat: chatId, attachments: { $exists: true, $ne: [] } })
    const publicids = [];
    messagesWithFiles.forEach(({ attachments }) => {
        attachments.forEach(({ publicid }) => {
            publicids.push(publicid)
        })
    })
    await Promise.all([deleteFilesFromClouinary(publicids), chat.deleteOne(), Message.deleteMany({ chat: chatId })])
    emitEvent(req, "REFETCH_CHAT", members);
    return res.status(200).json({
        success: true,
        message: "Chat deleted successfully"

    })

})
const getMessages = TryCatch(async (req, res, next) => {
    const chatId = req.params.id;
    const { page = 1, limit = 20 } = req.query;
    const chat = await Chat.findById(chatId)
    if (!chat) return next(new ErrorHandler("Chat not found", 404))

    if (!chat?.members?.includes(req.user.toString())) return next(new ErrorHandler("You are not allowed to access this chat", 403))

    const [messages, totalMessages] = await Promise.all([Message.find({ chat: chatId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("sender", "name").lean(), Message.countDocuments({ chat: chatId })]);
    const totalPages = Math.ceil(totalMessages / limit) || 0;

    return res.status(200).json({
        success: true,
        messages: messages.reverse(),
        totalPages,
    })
})

export { newGroupChat, getMyChats, getMyGroups, addMembers, removeMembers, leaveGroup, sendAttachments, getChatDetails, renameGroup, deleteChat, getMessages };