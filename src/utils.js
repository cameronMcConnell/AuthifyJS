const crypto = require("crypto");

class CryptoUtil {
    generateUniqueKey(username, password) {
        const hash = crypto.createHash("sha256");
        hash.update(username + password);
        return hash.digest("hex");
    }

    generateRandomToken() {
        return crypto.randomBytes(32).toString("hex");
    }
}

module.exports = CryptoUtil;