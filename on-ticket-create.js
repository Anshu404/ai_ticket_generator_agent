import {inngest } from "../client.js";
import User from "../models/user.js";
import Ticket from "../../models/ticket.js";
import { NonRetraibaleError } from "inngest";
import { sendMail} from "../../utils/email.js";
import analyzeTicket from "../../utils/ai.js";

export const onUserSignup = inngest.createFunction(
    { id: "on-user-signup", retries: 2 },
    { event: "user.signup" },
    async ({ event , step }) => {
        try {
            const {ticketID} = event.data

            // fetch ticket from DB
        const ticket = await step.run("fetch-ticket", async () => {
                const ticketObject = await Ticket.findById(ticketId);
                if (!ticket) {
                    throw new NonRetriableError("Ticket not found");
                }
                return ticketObject
        })
            await step.run("update-ticket-status", async () => {
                await Ticket.findByIdAndUpdate(ticket._id, { status: "TODO" }) 
            })
            const aiResponse = await analyzeTicket(ticket)

            await step.run("ai-processing ", async () =>{
                let skills = []
                if(aiResponse){
                    await Ticket.findByIdAndUpdate(ticket._id, {
                    priority : !["low" , "medium ", "high"].
                    includes(aiResponse.priority) ? "medium ": aiResponse.priority,
                    helpfulNotes: aiResponse.helpfulNotes,
                    status: "IN_PROGRESS",
                    relatedSkills: aiResponse.relatedSkills
                })
                skills  = aiResponse.relatedSkills
            }
            return skills
            })

            const moderator = await step.run( "assign-moderator ", async () => {
                //now we are going to do mongo db pipeline 
                let user = await User.findOne({
                    role: "moderator",
                    skills: {
                        $eleMatch: {
                            $regex: relatedskills.join("|"),
                            $options: "i",
                        },
                    },
                });


                if( !user){
                user = await User.findOne({
                    role: "admin"
                })
            }
            await Ticket.findByIdAndUpdate(ticket._id, {
                assignedTo: user?._id  || null
            })

            return user
            });

            await step.run(" send-email-notification",async () => {
                if(! moderator ){
                    const finalTicket = await Ticket.findByIdAndUpdate(ticket._id)


                    await sendMail(
                        moderator.email,
                        "Ticket Assigned",
                        `A new ticket has been assigned to you with the following details: ${finalTicket.title}`
                    )
            }
        })
            

        }
        catch (err) {
            console.error("Error processing ticket:", err);
        }
    }
        
);

