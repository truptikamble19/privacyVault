// PrivacyVault demo seed: users + AI platforms + request ledger
// Run from the MiniProject root:  npm install mongodb bcryptjs dotenv  &&  node seed-demo.js
require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGODB_URI || process.env.MONGO_URI; // match the name used in your .env
const DEMO_PASSWORD = 'Demo@1234';
const DAY = 24 * 60 * 60 * 1000;
const ago = (d, h = 0) => new Date(Date.now() - d * DAY - h * 3600 * 1000);

// AI platforms with the data each one "holds" (mock) and a risk rating
const PLATFORM_CATALOG = [
  { name: 'ChatGPT',    risk: 70, categories: ['Chat history', 'Uploaded files', 'Voice recordings', 'Account info', 'Usage analytics'] },
  { name: 'Claude',     risk: 40, categories: ['Chat history', 'Uploaded files', 'Account info'] },
  { name: 'Gemini',     risk: 82, categories: ['Chat history', 'Location', 'Voice recordings', 'Account info', 'Usage analytics', 'Contacts'] },
  { name: 'Copilot',    risk: 65, categories: ['Chat history', 'Browsing data', 'Account info', 'Usage analytics'] },
  { name: 'Meta AI',    risk: 88, categories: ['Chat history', 'Social profile', 'Location', 'Usage analytics', 'Contacts'] },
  { name: 'Perplexity', risk: 50, categories: ['Search history', 'Account info', 'Usage analytics'] },
  { name: 'Grok',       risk: 68, categories: ['Chat history', 'Social profile', 'Account info'] },
  { name: 'DeepSeek',   risk: 75, categories: ['Chat history', 'Device info', 'Keystroke patterns', 'Account info'] },
];

const riskLevel = (s) => (s >= 75 ? 'High' : s >= 50 ? 'Medium' : 'Low');

// Each user: which platforms are connected + their requests
const USERS = [
  {
    name: 'Aarav Sharma', email: 'aarav@demo.com',
    platforms: ['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Meta AI', 'Perplexity', 'Grok', 'DeepSeek'],
    requests: [
      { platform: 'Gemini',   type: 'Deletion',   category: 'Location',        status: 'Completed',    daysAgo: 12 },
      { platform: 'Meta AI',  type: 'Deletion',   category: 'Chat history',    status: 'Acknowledged', daysAgo: 6 },
      { platform: 'ChatGPT',  type: 'Correction', category: 'Account info',    status: 'Sent',         daysAgo: 2 },
      { platform: 'DeepSeek', type: 'Deletion',   category: 'Keystroke patterns', status: 'Sent',      daysAgo: 1 },
    ],
  },
  {
    name: 'Priya Patil', email: 'priya@demo.com',
    platforms: ['ChatGPT', 'Claude', 'Gemini', 'Perplexity'],
    requests: [
      { platform: 'ChatGPT', type: 'Deletion', category: 'Voice recordings', status: 'Completed',    daysAgo: 9 },
      { platform: 'Gemini',  type: 'Deletion', category: 'Chat history',     status: 'Acknowledged', daysAgo: 3 },
    ],
  },
  {
    name: 'Rohan Deshmukh', email: 'rohan@demo.com',
    platforms: ['ChatGPT', 'Copilot', 'Meta AI', 'Grok', 'DeepSeek'],
    requests: [
      { platform: 'Meta AI', type: 'Deletion',   category: 'Social profile', status: 'Sent', daysAgo: 1 },
    ],
  },
  {
    name: 'Sneha Kulkarni', email: 'sneha@demo.com',
    platforms: ['Claude', 'Perplexity', 'Gemini'],
    requests: [], // brand-new user, empty state for the demo
  },
  {
    name: 'Vikram Joshi', email: 'vikram@demo.com',
    platforms: ['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'DeepSeek'],
    requests: [
      { platform: 'DeepSeek', type: 'Deletion', category: 'Device info', status: 'Completed', daysAgo: 14 },
      { platform: 'Copilot',  type: 'Deletion', category: 'Browsing data', status: 'Acknowledged', daysAgo: 4 },
    ],
  },
  {
    name: 'Ananya Iyer', email: 'ananya@demo.com',
    platforms: ['ChatGPT', 'Gemini', 'Meta AI', 'Perplexity', 'Grok', 'Claude'],
    requests: [
      { platform: 'Meta AI', type: 'Deletion',   category: 'Location',     status: 'Completed', daysAgo: 20 },
      { platform: 'Gemini',  type: 'Correction', category: 'Account info', status: 'Completed', daysAgo: 11 },
      { platform: 'Grok',    type: 'Deletion',   category: 'Chat history', status: 'Sent',      daysAgo: 1 },
    ],
  },
  {
    name: 'Karan Mehta', email: 'karan@demo.com',
    platforms: ['ChatGPT', 'Copilot', 'Perplexity'],
    requests: [
      { platform: 'ChatGPT', type: 'Deletion', category: 'Uploaded files', status: 'Acknowledged', daysAgo: 5 },
    ],
  },
  {
    name: 'Divya Nair', email: 'divya@demo.com',
    platforms: ['Claude', 'Gemini', 'Meta AI', 'Grok', 'DeepSeek', 'ChatGPT', 'Copilot'],
    requests: [
      { platform: 'Gemini',   type: 'Deletion', category: 'Voice recordings', status: 'Sent',         daysAgo: 2 },
      { platform: 'DeepSeek', type: 'Deletion', category: 'Keystroke patterns', status: 'Acknowledged', daysAgo: 7 },
    ],
  },
  {
    name: 'Arjun Reddy', email: 'arjun@demo.com',
    platforms: ['ChatGPT', 'Claude'],
    requests: [],
  },
  {
    name: 'Meera Bhosale', email: 'meera@demo.com',
    platforms: ['ChatGPT', 'Gemini', 'Perplexity', 'Meta AI'],
    requests: [
      { platform: 'Meta AI', type: 'Deletion', category: 'Contacts', status: 'Completed', daysAgo: 16 },
      { platform: 'ChatGPT', type: 'Correction', category: 'Account info', status: 'Sent', daysAgo: 1 },
    ],
  },
  {
    name: 'Siddharth Rao', email: 'siddharth@demo.com',
    platforms: ['Gemini', 'Copilot', 'Grok', 'DeepSeek', 'Claude'],
    requests: [
      { platform: 'Grok', type: 'Deletion', category: 'Social profile', status: 'Acknowledged', daysAgo: 8 },
    ],
  },
];

// IMPORTANT: set this to the exact collection name you see in Atlas
// (e.g. 'requests' or 'privacyrequests')
const REQ_COLL = 'requests';

// Builds the Sent -> Acknowledged -> Completed timeline with timestamps
function buildHistory(status, daysAgo) {
  const history = [{ status: 'Sent', at: ago(daysAgo) }];
  if (status === 'Acknowledged' || status === 'Completed') history.push({ status: 'Acknowledged', at: ago(daysAgo - 1 > 0 ? daysAgo - 1 : 0, 2) });
  if (status === 'Completed') history.push({ status: 'Completed', at: ago(Math.max(daysAgo - 3, 0), 1) });
  return history;
}

(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    // Remove only previously seeded demo data (real accounts are untouched)
    const demoEmails = USERS.map((u) => u.email);
    const old = await db.collection('users').find({ email: { $in: demoEmails } }).toArray();
    const oldIds = old.map((u) => u._id);
    await db.collection('platforms').deleteMany({ userId: { $in: oldIds } });
    await db.collection(REQ_COLL).deleteMany({ userId: { $in: oldIds } });
    await db.collection('users').deleteMany({ email: { $in: demoEmails } });

    for (const u of USERS) {
      const { insertedId: userId } = await db.collection('users').insertOne({
  name: u.name,
  email: u.email,
  password: passwordHash,
  createdAt: ago(30),
});

      const platformDocs = u.platforms.map((pName) => {
        const p = PLATFORM_CATALOG.find((x) => x.name === pName);
        return {
          userId, name: p.name, riskScore: p.risk, riskLevel: riskLevel(p.risk),
          dataCategories: p.categories, status: 'connected', lastSynced: ago(0, 3),
        };
      });
      if (platformDocs.length) await db.collection('platforms').insertMany(platformDocs);

      const reqDocs = u.requests.map((r) => ({
        userId, platform: r.platform, type: r.type, category: r.category,
        status: r.status, history: buildHistory(r.status, r.daysAgo),
        createdAt: ago(r.daysAgo), updatedAt: ago(Math.max(r.daysAgo - 3, 0)),
      }));
      if (reqDocs.length) await db.collection(REQ_COLL).insertMany(reqDocs);

      console.log(`Seeded ${u.email}: ${platformDocs.length} platforms, ${reqDocs.length} requests`);
    }
    console.log(`\nDone. Log in with any demo email and password: ${DEMO_PASSWORD}`);
  } finally {
    await client.close();
  }
})();