import { inngest } from "../client";
import { User } from "../../models/user.js"; // Assuming you have a User model defined
import { NonRetryableError } from "inngest";



export const onUserSignup = inngest.createFunction(
    { id: "on-user-signup" , retries: 2},
    { event: "user/signup" },
    async ({ event, step }) => {
        try {
            const {email} = event.data
            const user = await step.run("get-user-email", async() => {
                const userObject = await User.findOne({ email })
                if (!userObject) {
                    throw new NonRetryableError("User not found");
                }
                return userObject;
            })

            await step.run("send-welcome-email", async () => {
                const subject = `welcome to the app`
                const message = `Hi,
                \n\n
                Thanks for signing up! We are excited to have you on board.`

                await sendMail(user.email, subject, message);
            })

            return {success: true}
        } catch (error){
            console.error("Error running step ", error.message)
            return {success: false}
        }
    }
);