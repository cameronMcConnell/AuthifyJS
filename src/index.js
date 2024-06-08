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

app.post("/signup", async (req, res) => {
    const userHash = cryptoUtil.generateUniqueKey(
        req.body["username"], req.body["password"]
    )

    
})

app.post("/login", async (req, res) => {

})

app.post("/forward", async (req, res) => {

})

app.use(express.json());

app.listen(port, async () => {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("users");
    console.log(`Listening on port ${port}`);
})