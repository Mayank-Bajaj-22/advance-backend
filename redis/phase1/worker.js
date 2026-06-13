import { Worker } from "bullmq";
import Redis from "ioredis";
import sendEmail from "./config/sendEmail.js";

const connection = new Redis(process.env.REDIS_URI, {
    maxRetriesPerRequest: null
})

const worker = new Worker("emailQueue", async (job) => {
    const email = job.data.email;
    console.log("job started")
    await sendEmail(email)
    console.log("job completed")
}, { connection })

// export default worker;