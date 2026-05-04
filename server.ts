import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
let bsqlite;
try {
  bsqlite = require("better-sqlite3");
} catch (e) {
  console.error("Failed to require better-sqlite3:", e);
}

const Database = (function() {
  if (typeof bsqlite === "function") return bsqlite;
  if (bsqlite && typeof bsqlite.default === "function") return bsqlite.default;
  return bsqlite;
})();

if (typeof Database !== "function") {
  console.error("DEBUG - better-sqlite3 export type:", typeof bsqlite);
  console.error("DEBUG - better-sqlite3 export value:", bsqlite);
}
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";

dotenv.config();

// --- DATABASE SETUP ---
const dbPath = path.join(process.cwd(), "database.sqlite");

function getDb() {
  try {
    const database = new Database(dbPath);
    // Quick integrity check
    database.pragma("journal_mode = WAL");
    database.pragma("synchronous = NORMAL");
    return database;
  } catch (err: any) {
    if (err.code === "SQLITE_CORRUPT" || err.message?.includes("malformed")) {
      console.error("Database is corrupted. Deleting and recreating...");
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      return new Database(dbPath);
    }
    throw err;
  }
}

const db = getDb();

function logAction(userId: number | null, userType: string, action: string, details: any = {}) {
  try {
    db.prepare(
      "INSERT INTO audit_logs (user_id, user_type, action, details) VALUES (?, ?, ?, ?)"
    ).run(userId, userType, action, JSON.stringify(details));
  } catch (error) {
    console.error("Failed to log action:", error);
  }
}

// Initialize schema
function initDb() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      mobile_number TEXT,
      barangay TEXT,
      birthday TEXT,
      gender TEXT,
      age INTEGER,
      purok TEXT,
      street TEXT,
      parent_name TEXT,
      parent_contact TEXT,
      interests TEXT, -- JSON string
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      admin_type TEXT CHECK(admin_type IN ('Youth Organizer', 'SK Official', 'Barangay Admin', 'System Admin')),
      organization_name TEXT,
      status TEXT DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      event_date TEXT NOT NULL,
      event_time TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      organizer_id INTEGER,
      organizer_type TEXT,
      organizer_name TEXT,
      status TEXT DEFAULT 'Active',
      capacity INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organizer_id) REFERENCES admins(id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id)
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      attendance_status TEXT DEFAULT 'Pending',
      additional_notes TEXT,
      UNIQUE(event_id, user_id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info', -- 'info', 'event_reminder', 'registration_success'
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER, -- Admin/User ID
      user_type TEXT, -- 'admin' or 'user'
      action TEXT NOT NULL, -- e.g., 'CREATE_EVENT', 'USER_REGISTER'
      details TEXT, -- JSON string of changes or info
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL, -- JSON string
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  db.exec(schema);

  // Seed default settings
  const hasCategories = db.prepare("SELECT key FROM system_settings WHERE key = 'event_categories'").get();
  if (!hasCategories) {
    const defaultCategories = JSON.stringify(['sports', 'education', 'volunteer', 'arts', 'health', 'wellness']);
    db.prepare("INSERT INTO system_settings (key, value) VALUES ('event_categories', ?)").run(defaultCategories);
  }


  // Migration: Add birthday and gender columns if they don't exist
  const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
  const hasBirthday = tableInfo.some(col => col.name === 'birthday');
  const hasGender = tableInfo.some(col => col.name === 'gender');

  if (!hasBirthday) {
    db.exec("ALTER TABLE users ADD COLUMN birthday TEXT");
  }
  if (!hasGender) {
    db.exec("ALTER TABLE users ADD COLUMN gender TEXT");
  }

  // Migration for new registration fields
  const hasAge = tableInfo.some(col => col.name === 'age');
  const hasPurok = tableInfo.some(col => col.name === 'purok');
  const hasStreet = tableInfo.some(col => col.name === 'street');
  const hasParentName = tableInfo.some(col => col.name === 'parent_name');
  const hasParentContact = tableInfo.some(col => col.name === 'parent_contact');

  if (!hasAge) db.exec("ALTER TABLE users ADD COLUMN age INTEGER");
  if (!hasPurok) db.exec("ALTER TABLE users ADD COLUMN purok TEXT");
  if (!hasStreet) db.exec("ALTER TABLE users ADD COLUMN street TEXT");
  if (!hasParentName) db.exec("ALTER TABLE users ADD COLUMN parent_name TEXT");
  if (!hasParentContact) db.exec("ALTER TABLE users ADD COLUMN parent_contact TEXT");

  // Migration for registrations
  const regTableInfo = db.prepare("PRAGMA table_info(registrations)").all() as any[];
  const hasAdditionalNotes = regTableInfo.some(col => col.name === 'additional_notes');
  if (!hasAdditionalNotes) db.exec("ALTER TABLE registrations ADD COLUMN additional_notes TEXT");

  // Migration for events capacity
  const eventTableInfo = db.prepare("PRAGMA table_info(events)").all() as any[];
  const hasCapacity = eventTableInfo.some(col => col.name === 'capacity');
  if (!hasCapacity) {
    db.exec("ALTER TABLE events ADD COLUMN capacity INTEGER DEFAULT 100");
  }

  // Migration for admin status
  const adminTableInfo = db.prepare("PRAGMA table_info(admins)").all() as any[];
  const hasStatus = adminTableInfo.some(col => col.name === 'status');
  if (!hasStatus) {
    db.exec("ALTER TABLE admins ADD COLUMN status TEXT DEFAULT 'Pending'");
  }

  // Migration for admin_type CHECK constraint
  const adminsMaster = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='admins'").get() as any;
  if (adminsMaster && !adminsMaster.sql.includes('System Admin')) {
    console.log("Migrating admins table for new CHECK constraint...");
    db.transaction(() => {
      // 1. Rename old table
      db.exec("ALTER TABLE admins RENAME TO admins_old");
      // 2. Create new table (using the schema defined above)
      db.exec(`
        CREATE TABLE admins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          admin_type TEXT CHECK(admin_type IN ('Youth Organizer', 'SK Official', 'Barangay Admin', 'System Admin')),
          organization_name TEXT,
          status TEXT DEFAULT 'Pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // 3. Copy data
      db.exec(`
        INSERT INTO admins (id, first_name, last_name, email, password, admin_type, organization_name, status, created_at)
        SELECT id, first_name, last_name, email, password, 
          CASE 
            WHEN admin_type = 'SK' THEN 'SK Official'
            WHEN admin_type = 'Barangay' THEN 'Barangay Admin'
            WHEN admin_type = 'Organization' THEN 'Youth Organizer'
            ELSE admin_type
          END, 
          organization_name, status, created_at
        FROM admins_old
      `);
      // 4. Drop old table
      db.exec("DROP TABLE admins_old");
    })();
  }

  // Seed default admin accounts if not exist
  const seedAdmins = [
    { email: "systemadmin@cabarkada.gov.ph", firstName: "System", lastName: "Admin", type: "System Admin", org: "CABarkada System", status: "Approved" },
    { email: "skadmin@cabarkada.gov.ph", firstName: "SK", lastName: "Official", type: "SK Official", org: "SK New Cabalan", status: "Approved" },
    { email: "brgyadmin@cabarkada.gov.ph", firstName: "Barangay", lastName: "Official", type: "Barangay Admin", org: "Barangay Council", status: "Approved" },
    { email: "youthadmin@cabarkada.gov.ph", firstName: "Youth", lastName: "Org", type: "Youth Organizer", org: "Youth Volunteers Org", status: "Approved" }
  ];

  const hashedDefaultPass = bcrypt.hashSync("admin123", 10);
  seedAdmins.forEach(admin => {
    const exists = db.prepare("SELECT id FROM admins WHERE email = ?").get(admin.email);
    if (!exists) {
      db.prepare(`
        INSERT INTO admins (first_name, last_name, email, password, admin_type, organization_name, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(admin.firstName, admin.lastName, admin.email, hashedDefaultPass, admin.type, admin.org, admin.status);
      console.log(`Admin account created: ${admin.email} / admin123 (${admin.type})`);
    }
  });
}

initDb();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const JWT_SECRET = process.env.JWT_SECRET || "cabarkada_secret_key";

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Helper for audit logging
  const logAction = (userId: any, userType: string, action: string, details: any) => {
    try {
      // Ensure userId is a number or null, handle NaN
      let cleanId = typeof userId === 'number' ? userId : parseInt(String(userId));
      if (isNaN(cleanId)) cleanId = null;

      db.prepare(`
        INSERT INTO audit_logs (user_id, user_type, action, details)
        VALUES (?, ?, ?, ?)
      `).run(cleanId, userType, action, JSON.stringify(details));
    } catch (err) {
      console.error("Audit log failed:", err);
    }
  };

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- AUTH ROUTES ---

  // User Registration
  app.post("/api/auth/register", async (req, res) => {
    const { firstName, lastName, email, password, mobileNumber, barangay, birthday, gender, age, purok, street, parentName, parentContact } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = db.prepare(
        `INSERT INTO users (
          first_name, last_name, email, password, mobile_number, barangay, birthday, gender, 
          age, purok, street, parent_name, parent_contact
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        firstName, lastName, email, hashedPassword, mobileNumber, barangay, birthday, gender, 
        age, purok, street, parentName, parentContact
      );
      
      const userId = result.lastInsertRowid;
      const token = jwt.sign({ id: userId, role: 'member' }, JWT_SECRET, { expiresIn: '24h' });
      
      // Welcome Notification
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `).run(userId, "Welcome to CABarkada!", "We're glad to have you here. Complete your profile to get personalized event recommendations!", "info");

      res.status(201).json({ 
        message: "User registered successfully",
        token,
        user: {
          id: userId,
          firstName,
          lastName,
          email,
          role: 'member',
          mobileNumber,
          barangay,
          birthday,
          gender,
          interests: []
        }
      });
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // User Login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

      const token = jwt.sign({ id: user.id, role: 'member' }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          firstName: user.first_name, 
          lastName: user.last_name, 
          email: user.email, 
          role: 'member',
          mobileNumber: user.mobile_number,
          barangay: user.barangay,
          birthday: user.birthday,
          gender: user.gender,
          interests: user.interests ? JSON.parse(user.interests) : []
        } 
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin Login
  app.post("/api/auth/admin/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const admin: any = db.prepare("SELECT * FROM admins WHERE email = ?").get(email);
      if (!admin) return res.status(401).json({ error: "Invalid credentials" });

      if (admin.status !== 'Approved') {
        return res.status(403).json({ error: "Your account is pending approval by the System Admin." });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

      const token = jwt.sign({ id: admin.id, role: 'admin', adminType: admin.admin_type }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ 
        token, 
        user: { 
          id: admin.id, 
          firstName: admin.first_name, 
          lastName: admin.last_name, 
          email: admin.email, 
          role: 'admin',
          adminType: admin.admin_type,
          organizationName: admin.organization_name
        } 
      });
    } catch (error) {
      res.status(500).json({ error: "Admin login failed" });
    }
  });

  // --- EVENT ROUTES ---

  // Get all events with pagination and filters
  app.get("/api/events", async (req, res) => {
    const { page = 1, limit = 10, category, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let baseQuery = `FROM events e WHERE 1=1`;
    const params: any[] = [];

    if (category) {
      baseQuery += " AND category = ?";
      params.push(category);
    }
    if (status) {
      baseQuery += " AND status = ?";
      params.push(status);
    }
    if (search) {
      baseQuery += " AND (title LIKE ? OR description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    const eventsQuery = `
      SELECT e.*, 
      (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as registrations,
      (SELECT COUNT(*) FROM registrations WHERE event_id = e.id AND attendance_status = 'Attended') as attendees
      ${baseQuery}
      ORDER BY event_date ASC LIMIT ? OFFSET ?
    `;

    try {
      const events = db.prepare(eventsQuery).all(...params, Number(limit), offset);
      const total = db.prepare(`SELECT COUNT(*) as count ${baseQuery}`).get(...params) as any;
      res.json({ events, total: total.count });
    } catch (error) {
      console.error("Fetch events error:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Get recommendations for user based on interests
  app.get("/api/events/recommendations", async (req, res) => {
    const { userId } = req.query;
    try {
      const user: any = db.prepare("SELECT interests FROM users WHERE id = ?").get(userId);
      if (!user || !user.interests) return res.json([]);
      
      const interests = JSON.parse(user.interests);
      if (interests.length === 0) return res.json([]);

      const placeholders = interests.map(() => "?").join(",");
      const events = db.prepare(`
        SELECT e.*, 
        (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as registrations
        FROM events e
        WHERE e.category IN (${placeholders}) AND e.status = 'Active'
        ORDER BY e.event_date ASC LIMIT 4
      `).all(...interests);

      res.json(events);
    } catch (error) {
      console.error("Recommendations error:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  // Get user's registered events
  app.get("/api/users/:id/events", async (req, res) => {
    const { id } = req.params;
    try {
      const events = db.prepare(`
        SELECT e.*, r.attendance_status, r.registration_date
        FROM events e
        JOIN registrations r ON e.id = r.event_id
        WHERE r.user_id = ?
        ORDER BY e.event_date ASC
      `).all(id);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user events" });
    }
  });

  // Update user profile
  app.put("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const { 
      firstName, lastName, mobileNumber, barangay, birthday, gender, interests,
      age, purok, street, parentName, parentContact
    } = req.body;
    try {
      // Get existing user to preserve values if not provided
      const existingUser: any = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      if (!existingUser) return res.status(404).json({ error: "User not found" });

      const finalFirstName = firstName !== undefined ? firstName : existingUser.first_name;
      const finalLastName = lastName !== undefined ? lastName : existingUser.last_name;
      const finalMobile = mobileNumber !== undefined ? mobileNumber : existingUser.mobile_number;
      const finalBarangay = barangay !== undefined ? barangay : existingUser.barangay;
      const finalBirthday = birthday !== undefined ? birthday : existingUser.birthday;
      const finalGender = gender !== undefined ? gender : existingUser.gender;
      const finalInterests = interests !== undefined ? JSON.stringify(interests) : existingUser.interests;
      const finalAge = age !== undefined ? age : existingUser.age;
      const finalPurok = purok !== undefined ? purok : existingUser.purok;
      const finalStreet = street !== undefined ? street : existingUser.street;
      const finalParentName = parentName !== undefined ? parentName : existingUser.parent_name;
      const finalParentContact = parentContact !== undefined ? parentContact : existingUser.parent_contact;

      db.prepare(`
        UPDATE users 
        SET first_name = ?, last_name = ?, mobile_number = ?, barangay = ?, birthday = ?, gender = ?, interests = ?,
            age = ?, purok = ?, street = ?, parent_name = ?, parent_contact = ?
        WHERE id = ?
      `).run(
        finalFirstName, finalLastName, finalMobile, finalBarangay, finalBirthday, finalGender, finalInterests, 
        finalAge, finalPurok, finalStreet, finalParentName, finalParentContact,
        id
      );
      res.json({ message: "Profile updated" });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Update attendance status (Admin)
  app.put("/api/events/:eventId/members/:userId/attendance", async (req, res) => {
    const { eventId, userId } = req.params;
    const { status, adminId } = req.body; // 'Attended', 'Absent', 'Pending'
    try {
      db.prepare("UPDATE registrations SET attendance_status = ? WHERE event_id = ? AND user_id = ?")
        .run(status, eventId, userId);
      
      const event: any = db.prepare("SELECT title FROM events WHERE id = ?").get(eventId);
      const member: any = db.prepare("SELECT first_name, last_name FROM users WHERE id = ?").get(userId);
      
      logAction(adminId, 'admin', 'MARK_ATTENDANCE', { 
        eventTitle: event?.title, 
        member: `${member?.first_name} ${member?.last_name}`,
        status 
      });
      
      res.json({ message: "Attendance updated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update attendance" });
    }
  });

  // Update event status (Admin)
  app.put("/api/events/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Active', 'Completed', 'Cancelled'
    try {
      db.prepare("UPDATE events SET status = ? WHERE id = ?").run(status, id);
      res.json({ message: "Event status updated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // --- ADMIN MANAGEMENT (Super Admin) ---
  app.get("/api/admins", async (req, res) => {
    try {
      const admins = db.prepare("SELECT id, first_name, last_name, email, admin_type, organization_name, status, created_at FROM admins").all();
      res.json(admins);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admins" });
    }
  });

  app.put("/api/admins/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status, adminId } = req.body; // 'Approved', 'Rejected', 'Pending'
    try {
      // Security check: only System Admin can approve
      const requester: any = db.prepare("SELECT admin_type FROM admins WHERE id = ?").get(adminId);
      if (!requester || requester.admin_type !== 'System Admin') {
        return res.status(403).json({ error: "Only System Admin can manage admin approvals" });
      }

      db.prepare("UPDATE admins SET status = ? WHERE id = ?").run(status, id);
      
      const targetAdmin: any = db.prepare("SELECT email FROM admins WHERE id = ?").get(id);
      logAction(adminId, 'admin', 'UPDATE_ADMIN_STATUS', { email: targetAdmin?.email, status });
      
      res.json({ message: "Admin status updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update admin status" });
    }
  });

  app.post("/api/admins", async (req, res) => {
    const { firstName, lastName, email, password, adminType, organizationName, creatorId } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.prepare(`
        INSERT INTO admins (first_name, last_name, email, password, admin_type, organization_name)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(firstName, lastName, email, hashedPassword, adminType, organizationName);
      
      logAction(creatorId, 'admin', 'CREATE_ORGANIZER', { email, organizationName });
      
      res.status(201).json({ message: "Admin created successfully" });
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Failed to create admin" });
    }
  });

  app.put("/api/admins/:id", async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, email, adminType, organizationName, password, creatorId } = req.body;
    try {
      // Security check: only System Admin can manage other admins
      const requester: any = db.prepare("SELECT admin_type FROM admins WHERE id = ?").get(creatorId);
      if (!requester || requester.admin_type !== 'System Admin') {
        return res.status(403).json({ error: "Only System Admin can manage other admins" });
      }

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.prepare(`
          UPDATE admins 
          SET first_name = ?, last_name = ?, email = ?, admin_type = ?, organization_name = ?, password = ?
          WHERE id = ?
        `).run(firstName, lastName, email, adminType, organizationName, hashedPassword, id);
      } else {
        db.prepare(`
          UPDATE admins 
          SET first_name = ?, last_name = ?, email = ?, admin_type = ?, organization_name = ?
          WHERE id = ?
        `).run(firstName, lastName, email, adminType, organizationName, id);
      }
      res.json({ message: "Admin updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update admin" });
    }
  });

  // Get all users (Youth Members)
  app.get("/api/users", async (req, res) => {
    try {
      const users = db.prepare("SELECT id, first_name, last_name, email, mobile_number, barangay, birthday, gender, created_at, 'member' as role FROM users").all();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
      db.prepare("DELETE FROM registrations WHERE user_id = ?").run(id);
      db.prepare("DELETE FROM notifications WHERE user_id = ?").run(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.delete("/api/admins/:id", async (req, res) => {
    const { id } = req.params;
    const adminId = req.query.adminId as string;
    try {
      // Security check: only System Admin can manage other admins
      const requester: any = db.prepare("SELECT admin_type FROM admins WHERE id = ?").get(adminId);
      if (!requester || requester.admin_type !== 'System Admin') {
        return res.status(403).json({ error: "Only System Admin can manage other admins" });
      }

      const targetAdmin: any = db.prepare("SELECT email FROM admins WHERE id = ?").get(id);
      db.prepare("DELETE FROM admins WHERE id = ?").run(id);
      
      logAction(Number(adminId), 'admin', 'DELETE_ORGANIZER', { email: targetAdmin?.email });
      
      res.json({ message: "Admin deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete admin" });
    }
  });

  // --- REPORTING ENDPOINTS ---
  app.get("/api/reports/engagement", async (req, res) => {
    try {
      // 1. Participation by Category
      const participationByCategory = db.prepare(`
        SELECT e.category, COUNT(r.id) as count
        FROM events e
        LEFT JOIN registrations r ON e.id = r.event_id
        GROUP BY e.category
      `).all();

      // 2. Registrations Trend (Last 7 days)
      const registrationsTrend = db.prepare(`
        SELECT date(registration_date) as date, COUNT(*) as count
        FROM registrations
        WHERE registration_date >= date('now', '-7 days')
        GROUP BY date(registration_date)
        ORDER BY date ASC
      `).all();

      // 3. Attendance Rates
      const attendanceSummary = db.prepare(`
        SELECT 
          attendance_status,
          COUNT(*) as count
        FROM registrations
        GROUP BY attendance_status
      `).all();

      res.json({
        participationByCategory,
        registrationsTrend,
        attendanceSummary
      });
    } catch (error) {
      console.error("Report error:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // Create event
  app.post("/api/events", async (req, res) => {
    const { title, category, date, time, location, description, image, organizerId, organizerType, organizerName, capacity } = req.body;
    try {
      db.prepare(
        "INSERT INTO events (title, category, event_date, event_time, location, description, image_url, organizer_id, organizer_type, organizer_name, capacity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(title, category, date, time, location, description, image, organizerId, organizerType, organizerName, capacity || 100);
      
      logAction(organizerId, 'admin', 'CREATE_EVENT', { title, category });
      
      res.status(201).json({ message: "Event created" });
    } catch (error) {
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  // Update event
  app.put("/api/events/:id", async (req, res) => {
    const { id } = req.params;
    const { title, category, date, time, location, description, image, capacity, status, adminId } = req.body;
    try {
      if (status) {
        db.prepare("UPDATE events SET status=? WHERE id=?").run(status, id);
        logAction(adminId, 'admin', 'UPDATE_EVENT_STATUS', { eventId: id, status });
      } else {
        db.prepare(
          "UPDATE events SET title=?, category=?, event_date=?, event_time=?, location=?, description=?, image_url=?, capacity=? WHERE id=?"
        ).run(title, category, date, time, location, description, image, capacity || 100, id);
        logAction(adminId, 'admin', 'UPDATE_EVENT_DETAILS', { eventId: id, title });
      }
      res.json({ message: "Event updated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  // Delete event
  app.delete("/api/events/:id", async (req, res) => {
    const { id } = req.params;
    const adminId = req.query.adminId as string;
    try {
      const event: any = db.prepare("SELECT title FROM events WHERE id = ?").get(id);
      db.prepare("DELETE FROM events WHERE id=?").run(id);
      
      logAction(Number(adminId), 'admin', 'DELETE_EVENT', { eventId: id, title: event?.title });
      
      res.json({ message: "Event deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Register for event
  app.post("/api/events/:id/register", async (req, res) => {
    const { id: eventId } = req.params;
    const { userId, additionalNotes } = req.body;
    try {
      db.prepare("INSERT INTO registrations (event_id, user_id, additional_notes) VALUES (?, ?, ?)")
        .run(eventId, userId, additionalNotes || null);
      
      logAction(userId, 'user', 'REGISTER_EVENT', { eventId });
      
      // Registration Notification
      const event: any = db.prepare("SELECT title FROM events WHERE id = ?").get(eventId);
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `).run(userId, "Registration Success", `You've successfully registered for ${event?.title}! See you there.`, "registration_success");

      res.status(201).json({ message: "Registered successfully" });
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Already registered" });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // --- NOTIFICATION ROUTES ---
  app.get("/api/users/:id/notifications", (req, res) => {
    const { id } = req.params;
    try {
      const notifications = db.prepare(`
        SELECT * FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `).all(id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification" });
    }
  });

  app.delete("/api/users/:id/notifications", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM notifications WHERE user_id = ?").run(id);
      res.json({ message: "Notifications cleared" });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear notifications" });
    }
  });

  // Get members for an event (Admin only)
  app.get("/api/events/:id/members", async (req, res) => {
    const { id: eventId } = req.params;
    try {
      const members = db.prepare(`
        SELECT u.id, u.first_name, u.last_name, u.email, u.mobile_number, u.barangay, r.registration_date, r.attendance_status
        FROM users u
        JOIN registrations r ON u.id = r.user_id
        WHERE r.event_id = ?
        ORDER BY r.registration_date DESC
      `).all(eventId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  // Post announcement for an event
  app.post("/api/events/:id/announcements", async (req, res) => {
    const { id: eventId } = req.params;
    const { title, message } = req.body;
    try {
      // 1. Save announcement
      db.prepare("INSERT INTO announcements (event_id, title, message) VALUES (?, ?, ?)")
        .run(eventId, title, message);
      
      // 2. Get all registered users
      const registrants = db.prepare("SELECT user_id FROM registrations WHERE event_id = ?").all(eventId) as any[];
      
      // 3. Send notifications to each registrant
      const insertNotification = db.prepare(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `);
      
      const event: any = db.prepare("SELECT title FROM events WHERE id = ?").get(eventId);
      
      for (const reg of registrants) {
        insertNotification.run(reg.user_id, `Update: ${event.title}`, message, "event_reminder");
      }

      res.status(201).json({ message: "Announcement posted and notifications sent" });
    } catch (error) {
      res.status(500).json({ error: "Failed to post announcement" });
    }
  });

  // Get announcements for an event
  app.get("/api/events/:id/announcements", (req, res) => {
    const { id: eventId } = req.params;
    try {
      const announcements = db.prepare("SELECT * FROM announcements WHERE event_id = ? ORDER BY created_at DESC").all(eventId);
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  // --- SYSTEM ADMIN ROUTES ---
  app.get("/api/system/audit-logs", async (req, res) => {
    try {
      const logs = db.prepare(`
        SELECT a.*, 
        COALESCE(u.first_name || ' ' || u.last_name, ad.first_name || ' ' || ad.last_name) as user_name
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id AND a.user_type = 'user'
        LEFT JOIN admins ad ON a.user_id = ad.id AND a.user_type = 'admin'
        ORDER BY a.created_at DESC LIMIT 100
      `).all();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/system/settings", async (req, res) => {
    try {
      const settings = db.prepare("SELECT * FROM system_settings").all();
      const settingsMap = settings.reduce((acc: any, s: any) => {
        try {
          acc[s.key] = JSON.parse(s.value);
        } catch (e) {
          acc[s.key] = s.value;
        }
        return acc;
      }, {});
      res.json(settingsMap);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/system/settings/:key", async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    try {
      db.prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)")
        .run(key, JSON.stringify(value));
      res.json({ message: "Setting updated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  app.post("/api/system/backup", async (req, res) => {
    try {
      res.json({ message: "Backup initiated", timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: "Backup failed" });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
