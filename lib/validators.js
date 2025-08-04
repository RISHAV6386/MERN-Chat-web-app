import { body, param, validationResult } from "express-validator";
import { ErrorHandler } from "../utils/utility.js";
const validateHandler = (req, res, next) => {
    const errors = validationResult(req)
    const errorMessage = errors.array().map((error) => error.msg).join(", ")
    console.log(errorMessage);
    if (errors.isEmpty()) return next();
    else next(new ErrorHandler(errorMessage,400))
}
const registerValidator = () => [
    body("name", "Please Enter Name").notEmpty(),
    body("username", "Please Enter Username").notEmpty(),
    body("password", "Please Enter Password").notEmpty(),
    body("bio", "Please Enter Bio").notEmpty(),
];
const loginValidator = () => [
    body("username", "Please Enter Username").notEmpty(),
    body("password", "Please Enter Password").notEmpty(),
];
const newGroupValidator = () => [
    body("name", "Please Enter name").notEmpty(),
    body("members").notEmpty().withMessage("Please Enter member").isArray({min:2,max:50}).withMessage("Members must be 2 to 50"),
];

const addMembersValidator = () => [
    body("chatId", "Please Enter chatId").notEmpty(),
    body("members").notEmpty().withMessage("Please Enter member").isArray({min:1}).withMessage("Please Enter atleast a member"),
];

const removeMembersValidator = () => [
    body("chatId", "Please Enter Chat Id").notEmpty(),
    body("userId", "Please Enter User Id").notEmpty(),
];

const leaveGroupValidator = () => [
    param("id", "Please Enter Chat Id").notEmpty(),
];
const sendAttachmentsValidator = () => [
    body("chatId", "Please Enter Chat Id").notEmpty(),
];
const getMessagesValidator = () => [
    param("id", "Please Enter Chat Id").notEmpty(),
];
const getChatDetailsValidator = () => [
    param("id", "Please Enter Chat Id").notEmpty(),
];
const renameValidator = () => [
    body("name","Please Enter Name").notEmpty(),
    param("id", "Please Enter Chat Id").notEmpty(),
];
const deleteChatValidator = () => [
    param("id", "Please Enter Chat Id").notEmpty(),
];
const sendRequestValidator = () => [
    body("userId", "Please Enter User Id").notEmpty(),
];
const acceptRequestValidator = () => [
    body("requestId", "Please Enter Request Id").notEmpty(),
    body("accept",).notEmpty().withMessage("Please Add Accept").isBoolean().withMessage("Accept must be Boolean"),
];
const adminLoginValidator = () => [
    body("secretKey", "Please Enter secretKey").notEmpty(),
];

export { acceptRequestValidator, addMembersValidator, adminLoginValidator, deleteChatValidator, getChatDetailsValidator, getMessagesValidator, leaveGroupValidator, loginValidator, newGroupValidator, registerValidator, removeMembersValidator, renameValidator, sendAttachmentsValidator, sendRequestValidator, validateHandler };

