const express = require("express");
const axios = require("axios");
const { MongoClient } = require("mongodb");
const CryptoUtil = require("./utils");

const app = express();
const port = process.env.PORT;

const mongoUrl = proces.env.MONGO_URL;

const client = new MongoClient(mongoUrl);

const cryptoUtil = new CryptoUtil();

const connectToMongoDBServer = async () => {
    try {
        await client.connect();
        return client.db("AuthifyJS").collection("users");
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

let collection;
connectToMongoDBServer().then((col) => {
    collection = col;
    console.log("Connected to collection users");
});

app.use(express.json());

app.post("/signup", async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;

        const existingUser = await collection.findOne({ username });

        if (existingUser) {
            return res.status(409).json({ error: "Username already exists" });
        }

        const passwordHash = cryptoUtil.getPasswordHash(password);

        const token = cryptoUtil.generateRandomToken();

        const user = {
            username,
            passwordHash,
            token,
            data: req.body.data
        }

        await collection.insertOne(user);

        res.status(201).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Serer Error" });
    }
});

app.post("/login", async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;

        const user = await collection.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const passwordHash = cryptoUtil.getPasswordHash(password);

        if (passwordHash !== user.passwordHash) {
            return res.status(401).json({ error: "Invalid password" });
        }

        const token = cryptoUtil.generateRandomToken();

        await collection.updateOne({ username }, { $set: { token }});

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error "});
    }
});

app.post("/forward", async (req, res) => {
    try {
        const token = req.body.token;
        const url = req.body.url;
        const method = req.body.method;
        const data = req.body.data;

        const existingUser = await collection.findOne({ token });

        if (!existingUser) {
            return res.status(401).json({ error: "Unauthorized access" });
        }

        if (method === "GET") {
            const forwardRes = await axios.get(url);

            if (forwardRes.status === 200) {
                return res.status(200).json(forwardRes.data);
            }

            res.status(forwardRes.status).json({ error: forwardRes.statusText });
        }
        else if (method === "POST") {
            const forwardRes = await axios.post(url, data);

            if (forwardRes.status === 200) {
                return res.status(200).json(forwardRes.data);
            }

            res.status(forwardRes.status).json({ error: forwardRes.statusText });
        }
        else {
            res.status(405).json({ error: "Method Not Allowed" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error "});
    }
});

app.post("/change_password", async (req, res) => {
    try {
        const token = req.body.token;
        const newPassword = req.body.newPassword;

        const existingUser = await collection.findOne({ token });

        if (!existingUser) {
            return res.status(401).json({ error: "Unauthorized access" });
        }

        const newPasswordHash = cryptoUtil.getPasswordHash(newPassword);        

        await collection.updateOne({ token }, { $set: { passwordHash: newPasswordHash }});

        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error "});
    }
});

app.listen(port, async () => {
    console.log(`Listening on port ${port}`);
});