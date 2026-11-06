import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const CONTACT_FILE = path.join(DATA_DIR, 'contact-messages.json');

const ADMIN_EMAIL = 'preethamjee2008@gmail.com';

function loadMessages() {
  try {
    if (fs.existsSync(CONTACT_FILE)) {
      return JSON.parse(fs.readFileSync(CONTACT_FILE, 'utf8'));
    }
  } catch (err) {
    console.warn('[Contact] Error reading contact messages:', err.message);
  }
  return [];
}

function saveMessages(messages) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONTACT_FILE, JSON.stringify(messages, null, 2), 'utf8');
  } catch (err) {
    console.error('[Contact] Error saving contact messages:', err.message);
  }
}

export function createContactRouter() {
  const router = express.Router();
  router.use(express.json());

  // 1. Submit Contact / Help Inquiry
  router.post('/submit', (req, res) => {
    try {
      const { name, email, phone = '', subject = 'General Support', message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
      }

      const cleanName = String(name).trim().slice(0, 100);
      const cleanEmail = String(email).trim().toLowerCase().slice(0, 120);
      const cleanPhone = String(phone).trim().slice(0, 20);
      const cleanSubject = String(subject).trim().slice(0, 150);
      const cleanMessage = String(message).trim().slice(0, 2000);

      const msg = {
        id: `msg_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        subject: cleanSubject,
        message: cleanMessage,
        status: 'NEW',
        createdAt: Date.now()
      };

      const messages = loadMessages();
      messages.unshift(msg);
      saveMessages(messages);

      res.json({
        ok: true,
        message: 'Your message has been delivered to Admin. We will get back to you shortly.',
        inquiryId: msg.id
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to submit contact message', details: err.message });
    }
  });

  // 2. Admin: Get all inquiries
  router.get('/messages', (req, res) => {
    try {
      const adminHeader = (req.headers['x-admin-email'] || req.query.adminEmail || '').toLowerCase();
      if (adminHeader !== ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Access restricted to Super Admin.' });
      }

      const messages = loadMessages();
      res.json({ ok: true, messages });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch inquiries', details: err.message });
    }
  });

  // 3. Admin: Mark inquiry resolved
  router.post('/resolve', (req, res) => {
    try {
      const adminHeader = (req.headers['x-admin-email'] || req.body.adminEmail || '').toLowerCase();
      if (adminHeader !== ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Access restricted to Super Admin.' });
      }

      const { id } = req.body;
      const messages = loadMessages();
      const target = messages.find(m => m.id === id);
      if (target) {
        target.status = 'RESOLVED';
        target.resolvedAt = Date.now();
        saveMessages(messages);
      }

      res.json({ ok: true, message: 'Inquiry marked as resolved.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update inquiry', details: err.message });
    }
  });

  return router;
}
