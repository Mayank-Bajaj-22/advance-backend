import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./model/user.model.js";
import Redis from "ioredis";
dotenv.config();

const app = express();

const redis = new Redis(process.env.REDIS_URI);

app.use(express.json());

const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
    return res.status(200).json({ message: "hello from redis" });
})

app.post("/create", async (req, res) => {
    const { name, email, password } = req.body;
    await redis.del("user:all"); 
    const user = await User.create({ name, email , password });
    return res.status(200).json(user);
})

app.get("/get-users", async (req, res) => {
    const user = await User.find({});
    return res.status(200).json(user);
})

app.get("/get-with-redis", async (req,res) => {
    const cached = await redis.get("user:all");

    if (cached) {
        console.log("cached user")
        return res.status(200).json(JSON.parse(cached));
    }

    const user = await User.find({});

    await redis.set("user:all", JSON.stringify(user));

    return res.status(200).json(user);
})

app.listen(port, () => {
    connectDB();
    console.log(`server started on ${port}`);
})