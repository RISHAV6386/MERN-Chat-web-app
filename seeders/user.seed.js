import { User } from "../models/user.js"
import {faker} from "@faker-js/faker"

const creatUser=async(numUs)=>{
    try {
        const usersPromise=[]
        for (let i = 0; i < numUs; i++) {
            const tempUser = User.create({
                name:faker.person.fullName(),
                username:faker.internet.userName(),
                bio:faker.lorem.sentence(10),
                password:"password",
                avatar:{
                    url:faker.image.avatar(),
                    public_id:faker.system.fileName()
                }
            });;
            usersPromise.push(tempUser);
            }
                await Promise.all(usersPromise)
                console.log("Users created",numUs)
                process.exit(1)

    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}
export default creatUser