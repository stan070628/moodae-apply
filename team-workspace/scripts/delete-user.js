const fs = require("fs");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const envContent = fs.readFileSync(".env.local", "utf-8");
const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT=(.*)/);
if (!match) { console.error("FIREBASE_SERVICE_ACCOUNT not found"); process.exit(1); }
let raw = match[1].trim();
if (raw.startsWith("'") && raw.endsWith("'")) raw = raw.slice(1, -1);

initializeApp({ credential: cert(JSON.parse(raw)) });
const db = getFirestore();

const userId = process.argv[2];
if (!userId) { console.error("Usage: node scripts/delete-user.js <userId>"); process.exit(1); }

db.doc(`users/${userId}`).delete()
  .then(() => console.log(`Deleted users/${userId}`))
  .catch((e) => console.error(e));
