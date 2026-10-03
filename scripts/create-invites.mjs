import { createHash, randomBytes } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local first.");
}

const args = process.argv.slice(2);
const countArg = args.find((arg) => arg.startsWith("--count="))?.split("=")[1];
const daysArg = args.find((arg) => arg.startsWith("--days="))?.split("=")[1];
const count = Number(countArg ?? 1);
const days = Number(daysArg ?? 30);
if (!Number.isInteger(count) || count < 1 || count > 100) throw new Error("Use --count=1 through --count=100.");
if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error("Use --days=1 through --days=365.");

const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const expiresAt = Timestamp.fromDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000));
const invitations = [];

for (let index = 0; index < count; index += 1) {
  const bytes = randomBytes(12);
  const raw = [...bytes].map((byte) => alphabet[byte & 31]).join("");
  const code = `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
  const hash = createHash("sha256").update(raw).digest("hex");
  await db.collection("accessInvites").doc(hash).create({
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
    redeemedAt: null,
    redeemedBy: null,
  });
  invitations.push(code);
}

console.log(`Created ${invitations.length} one-use invite${invitations.length === 1 ? "" : "s"}. Each expires in ${days} days.`);
console.log("Give each code to one student in person and keep this output private:");
for (const code of invitations) console.log(code);
