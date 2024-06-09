const express = require("express");
const axios = require("axios");
const MongoClient = require("mongodb");
const CryptoUtil = require("./utils");

const app = express();
const port = 3000;

const url = "mongodb://localhost:27017";
const client = new MongoClient(url);
const dbName = "AuthifyJS";

const cryptoUtil = new CryptoUtil();

async function connectToMongoDBServer() {
    try {
        await client.connect();
        return client.db(dbName).collection("users");
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

const collection = connectToMongoDBServer();

app.post("/signup", async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;

        const existingUser = await collection.findOne({ username });

        if (existingUser) {
            res.status(409).json({ error: "Username already exists" });
        }

        const passwordHash = cryptoUtil.getPasswordHash(password);

        const token = cryptoUtil.generateRandomToken();

        const user = {
            username,
            passwordHash,
            token,
            data: req.body["data"]
        }

        await collection.insert(user);

        res.status(201).json({ token });
    } 
    
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Serer Error" });
    }
})

app.post("/login", async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;

        const user = await collection.findOne({ username });

        if (!user) {
            res.status(404).json({ error: "User not found" });
        }

        const passwordHash = cryptoUtil.getPasswordHash(password);

        if (passwordHash !== user.passwordHash) {
            res.status(401).json({ error: "Invalid password" });
        }

        const token = cryptoUtil.generateRandomToken();

        await collection.updateOne({ username }, { $set: { token }});

        res.status(200).json({ token });
    } 
    
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error "});
    }
})

app.post("/forward", async (req, res) => {

})

app.use(express.json());

app.listen(port, async () => {
    console.log(`Listening on port ${port}`);
})