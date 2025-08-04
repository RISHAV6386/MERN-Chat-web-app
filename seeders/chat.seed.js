import { Chat } from "../models/chat.js"
import { User } from "../models/user.js"
import {faker} from "@faker-js/faker"

const creatSingleChats = async (numChats) => {
    try {
        const users = await User.find().select("_id")
        const chatsPromise = []
        for (let i = 0; i < users.length; i++) {
            for (let j = 0; j < users.length; j++) {
                chatsPromise.push(
                    Chat.create({
                        name: faker.lorem.word(2),
                        members: [users[i], users[j]],
                    })
                )
            }
        }
        await Promise.all(chatsPromise)
        console.log("Chat created successfully")
        process.exit();

    } catch (error) {
        console.log(error)
        process.exit(1);
    }
}
export default creatSingleChats