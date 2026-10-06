"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeeds = runSeeds;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const index_1 = require("./index");
const config_1 = require("../config");
async function runSeeds() {
    console.log('[DB] Seeding database...');
    // 1. Seed Admin User
    const existingAdmin = await (0, index_1.query)('SELECT * FROM admin_users WHERE username = $1', ['admin']);
    if (existingAdmin.rowCount === 0) {
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(config_1.config.adminDefaultPassword, salt);
        await (0, index_1.query)('INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)', ['admin', passwordHash]);
        console.log('[DB] Admin user created with username: admin');
    }
    else {
        console.log('[DB] Admin user already exists.');
    }
    // 2. Seed Products
    const productsCountRes = await (0, index_1.query)('SELECT COUNT(*) as count FROM products');
    const count = parseInt(productsCountRes.rows[0]?.count || '0', 10);
    if (count === 0) {
        const productsJsonPath = path_1.default.resolve(__dirname, '../../../myapp/src/data/products.json');
        if (fs_1.default.existsSync(productsJsonPath)) {
            const raw = fs_1.default.readFileSync(productsJsonPath, 'utf-8');
            const products = JSON.parse(raw);
            for (const p of products) {
                await (0, index_1.query)(`INSERT INTO products (
            id, name, description, price, category, image_url, images, rating, reviews,
            highlights, material, dimensions, delivery_info, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO NOTHING`, [
                    p.id,
                    p.name,
                    p.description || '',
                    p.price || 0,
                    p.category || 'Decor',
                    p.imageUrl || '',
                    JSON.stringify(p.images || (p.imageUrl ? [p.imageUrl] : [])),
                    p.rating || 5.0,
                    p.reviews || 1,
                    JSON.stringify(p.highlights || []),
                    p.material || 'Handcrafted',
                    p.dimensions || 'Standard',
                    p.deliveryInfo || 'Ships in 2-3 business days',
                    true,
                ]);
            }
            console.log(`[DB] Seeded ${products.length} products.`);
        }
    }
    else {
        console.log(`[DB] Products table already has ${count} records.`);
    }
    // 3. Seed Specials
    const specialsCountRes = await (0, index_1.query)('SELECT COUNT(*) as count FROM specials');
    const sCount = parseInt(specialsCountRes.rows[0]?.count || '0', 10);
    if (sCount === 0) {
        const specialsJsonPath = path_1.default.resolve(__dirname, '../../../myapp/src/data/specials.json');
        if (fs_1.default.existsSync(specialsJsonPath)) {
            const raw = fs_1.default.readFileSync(specialsJsonPath, 'utf-8');
            const specials = JSON.parse(raw);
            for (const s of specials) {
                await (0, index_1.query)(`INSERT INTO specials (
            id, name, tagline, price, original_price, offer_text, image_url, images,
            product_id, category, description, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO NOTHING`, [
                    s.id,
                    s.name,
                    s.tagline || 'Festive special offer',
                    s.price || 0,
                    s.originalPrice || Math.round((s.price || 0) * 1.25),
                    s.offerText || '20% OFF',
                    s.imageUrl || '',
                    JSON.stringify(s.images || (s.imageUrl ? [s.imageUrl] : [])),
                    s.productId || s.id,
                    s.category || 'Combos',
                    s.description || '',
                    true,
                ]);
            }
            console.log(`[DB] Seeded ${specials.length} specials.`);
        }
    }
    else {
        console.log(`[DB] Specials table already has ${sCount} records.`);
    }
    // 4. Seed Default Site Settings
    await (0, index_1.query)(`INSERT INTO site_settings (setting_key, setting_value)
     VALUES
      ('announcement_text', '✨ Handcrafted Gifts & Artisanal Crafts'),
      ('announcement_subtext', 'Free Shipping on Orders Over ₹500'),
      ('is_announcement_active', 'true'),
      ('contact_email', 'kelo.keylove.admin@gmail.com'),
      ('instagram_handle', '@kelo.keylove'),
      ('specials_title', 'Hall Days & Festive Specials')
     ON CONFLICT (setting_key) DO NOTHING`);
    console.log('[DB] Seeded default site settings.');
    // 5. Seed a Sample Event, Poll, and Painting Competition
    const eventsCountRes = await (0, index_1.query)('SELECT COUNT(*) as count FROM events');
    const eCount = parseInt(eventsCountRes.rows[0]?.count || '0', 10);
    if (eCount === 0) {
        const eventId1 = 'evt_hall_days_2026';
        await (0, index_1.query)(`INSERT INTO events (id, title, description, date_time, location, banner_url, event_type, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
            eventId1,
            'Annual Hall Days Craft Exhibition 2026',
            'Join us for the premier handcrafted gifting stalls across campus halls! Exclusive student discounts and custom mementos.',
            'March 28, 2026 • 5:00 PM - 10:00 PM',
            'Gymkhana Grounds, IIT Kharagpur',
            'https://res.cloudinary.com/zo7u3tba/image/upload/v1787248483/Heart-frame.jpg',
            'hall_day',
            true,
        ]);
        const eventId2 = 'evt_paint_comp_2026';
        await (0, index_1.query)(`INSERT INTO events (id, title, description, date_time, location, banner_url, event_type, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
            eventId2,
            'Rang-e-KGP Painting Competition 2026',
            'Annual inter-hall painting and sketch competition celebrating art and emotion. Register now to showcase your talent!',
            'April 5, 2026 • 10:00 AM',
            'Kalidas Auditorium & Foyer',
            'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600&q=80',
            'painting_competition',
            true,
        ]);
        const eventId3 = 'evt_poll_gift_2026';
        await (0, index_1.query)(`INSERT INTO events (id, title, description, date_time, location, banner_url, event_type, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
            eventId3,
            'Campus Choice: Most Loved Festive Gift',
            'The official poll to decide which handcrafted artisan gift takes the spotlight this season.',
            'Ongoing • Closes April 10, 2026',
            'Online Campus Poll',
            'https://res.cloudinary.com/zo7u3tba/image/upload/v1787367075/WhatsApp_Image_2026-08-22_at_08.19.39_1.jpg',
            'poll',
            true,
        ]);
        // Create Poll linked to eventId3
        const pollId = 'poll_gift_2026';
        await (0, index_1.query)(`INSERT INTO polls (id, event_id, title, description, is_open)
       VALUES ($1, $2, $3, $4, $5)`, [
            pollId,
            eventId3,
            'Which handcrafted item should be the Hall Day Showcase Gift?',
            'Official administrative polling contest.',
            true,
        ]);
        await (0, index_1.query)(`INSERT INTO poll_options (id, poll_id, option_text, votes)
       VALUES
        ('opt_1', $1, 'Memory Heart Light Frame', 12),
        ('opt_2', $1, 'Handcrafted Scrap Book Hamper', 8),
        ('opt_3', $1, 'Custom Beaded Couple Bracelets', 5),
        ('opt_4', $1, 'Geometric Wooden Polaroid Stand', 3)`, [pollId]);
        console.log('[DB] Seeded initial events and polling contest.');
    }
    console.log('[DB] Database seeding complete.');
}
if (require.main === module || process.argv[1]?.endsWith('seed.ts')) {
    runSeeds().then(() => {
        process.exit(0);
    }).catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
