"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
exports.productsRouter = (0, express_1.Router)();
// Helper to format product row
function formatProduct(row) {
    return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        price: Number(row.price),
        category: row.category || 'Decor',
        imageUrl: row.image_url,
        images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || [row.image_url]),
        rating: row.rating ? Number(row.rating) : 5.0,
        reviews: row.reviews ? Number(row.reviews) : 1,
        highlights: typeof row.highlights === 'string' ? JSON.parse(row.highlights) : (row.highlights || []),
        material: row.material,
        dimensions: row.dimensions,
        deliveryInfo: row.delivery_info,
        isActive: row.is_active !== false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
// Helper to format special row
function formatSpecial(row) {
    return {
        id: row.id,
        name: row.name,
        tagline: row.tagline,
        price: Number(row.price),
        originalPrice: row.original_price ? Number(row.original_price) : Math.round(Number(row.price) * 1.25),
        offerText: row.offer_text || '20% OFF',
        imageUrl: row.image_url,
        images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || [row.image_url]),
        productId: row.product_id || row.id,
        category: row.category || 'Combos',
        description: row.description,
        isActive: row.is_active !== false,
    };
}
// ─── 1. Products (Public & Admin) ──────────────────────────
// GET /api/products
exports.productsRouter.get('/', async (req, res) => {
    try {
        const includeInactive = req.query.all === 'true';
        let sql = 'SELECT * FROM products ORDER BY created_at ASC';
        if (!includeInactive) {
            sql = 'SELECT * FROM products WHERE is_active = TRUE ORDER BY created_at ASC';
        }
        const result = await (0, db_1.query)(sql);
        const data = result.rows.map(formatProduct);
        res.json({ success: true, count: data.length, data });
    }
    catch (err) {
        console.error('[Products GET error]', err);
        res.status(500).json({ success: false, error: 'Failed to retrieve products' });
    }
});
// GET /api/products/:id
exports.productsRouter.get('/:id', async (req, res) => {
    try {
        const result = await (0, db_1.query)('SELECT * FROM products WHERE id = $1', [req.params.id]);
        if (result.rowCount === 0) {
            res.status(404).json({ success: false, error: 'Product not found' });
            return;
        }
        res.json({ success: true, data: formatProduct(result.rows[0]) });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch product' });
    }
});
// POST /api/products (Admin Only)
exports.productsRouter.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const body = req.body;
        const id = body.id || `p_${Date.now()}`;
        const name = body.name || 'Untitled Product';
        const description = body.description || '';
        const price = Number(body.price) || 0;
        const category = body.category || 'Decor';
        const imageUrl = body.imageUrl || 'https://res.cloudinary.com/zo7u3tba/image/upload/v1787248483/Heart-frame.jpg';
        const images = Array.isArray(body.images) && body.images.length > 0 ? body.images : [imageUrl];
        const rating = Number(body.rating) || 5.0;
        const reviews = Number(body.reviews) || 1;
        const highlights = Array.isArray(body.highlights) ? body.highlights : [];
        const material = body.material || 'Handcrafted';
        const dimensions = body.dimensions || 'Standard';
        const deliveryInfo = body.deliveryInfo || 'Ships in 2-3 business days';
        const isActive = body.isActive !== false;
        const insertSql = `
      INSERT INTO products (
        id, name, description, price, category, image_url, images, rating, reviews,
        highlights, material, dimensions, delivery_info, is_active, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
      RETURNING *
    `;
        const result = await (0, db_1.query)(insertSql, [
            id, name, description, price, category, imageUrl,
            JSON.stringify(images), rating, reviews, JSON.stringify(highlights),
            material, dimensions, deliveryInfo, isActive
        ]);
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: formatProduct(result.rows[0]),
        });
    }
    catch (err) {
        console.error('[Add Product Error]', err);
        res.status(500).json({ success: false, error: err.message || 'Failed to create product' });
    }
});
// PUT /api/products/:id (Admin Only)
exports.productsRouter.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await (0, db_1.query)('SELECT * FROM products WHERE id = $1', [id]);
        if (existing.rowCount === 0) {
            res.status(404).json({ success: false, error: 'Product not found' });
            return;
        }
        const current = existing.rows[0];
        const b = req.body;
        const name = b.name !== undefined ? b.name : current.name;
        const description = b.description !== undefined ? b.description : current.description;
        const price = b.price !== undefined ? Number(b.price) : Number(current.price);
        const category = b.category !== undefined ? b.category : current.category;
        const imageUrl = b.imageUrl !== undefined ? b.imageUrl : current.image_url;
        const images = b.images !== undefined ? b.images : (typeof current.images === 'string' ? JSON.parse(current.images) : current.images);
        const rating = b.rating !== undefined ? Number(b.rating) : Number(current.rating);
        const reviews = b.reviews !== undefined ? Number(b.reviews) : Number(current.reviews);
        const highlights = b.highlights !== undefined ? b.highlights : (typeof current.highlights === 'string' ? JSON.parse(current.highlights) : current.highlights);
        const material = b.material !== undefined ? b.material : current.material;
        const dimensions = b.dimensions !== undefined ? b.dimensions : current.dimensions;
        const deliveryInfo = b.deliveryInfo !== undefined ? b.deliveryInfo : current.delivery_info;
        const isActive = b.isActive !== undefined ? Boolean(b.isActive) : current.is_active;
        const updateSql = `
      UPDATE products SET
        name = $1, description = $2, price = $3, category = $4, image_url = $5,
        images = $6, rating = $7, reviews = $8, highlights = $9, material = $10,
        dimensions = $11, delivery_info = $12, is_active = $13, updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `;
        const result = await (0, db_1.query)(updateSql, [
            name, description, price, category, imageUrl,
            JSON.stringify(images), rating, reviews, JSON.stringify(highlights),
            material, dimensions, deliveryInfo, isActive, id
        ]);
        res.json({
            success: true,
            message: 'Product updated successfully',
            data: formatProduct(result.rows[0]),
        });
    }
    catch (err) {
        console.error('[Update Product Error]', err);
        res.status(500).json({ success: false, error: err.message || 'Failed to update product' });
    }
});
// DELETE /api/products/:id (Admin Only)
exports.productsRouter.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await (0, db_1.query)('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ success: false, error: 'Product not found' });
            return;
        }
        res.json({ success: true, message: 'Product deleted successfully', id });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to delete product' });
    }
});
// ─── 2. Specials & Combos ──────────────────────────────────
// GET /api/specials
exports.productsRouter.get('/specials/list', async (_req, res) => {
    try {
        const result = await (0, db_1.query)('SELECT * FROM specials WHERE is_active = TRUE ORDER BY id ASC');
        const data = result.rows.map(formatSpecial);
        res.json({ success: true, count: data.length, data });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to load specials' });
    }
});
// GET /api/specials/:id
exports.productsRouter.get('/specials/:id', async (req, res) => {
    try {
        const result = await (0, db_1.query)('SELECT * FROM specials WHERE id = $1', [req.params.id]);
        if (result.rowCount === 0) {
            res.status(404).json({ success: false, error: 'Special offer not found' });
            return;
        }
        res.json({ success: true, data: formatSpecial(result.rows[0]) });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch special offer' });
    }
});
// ─── 3. Store Statistics ───────────────────────────────────
// GET /api/stats
exports.productsRouter.get('/store/stats', async (_req, res) => {
    try {
        const pRes = await (0, db_1.query)('SELECT COUNT(*) as count, MIN(price) as min_price, MAX(price) as max_price FROM products WHERE is_active = TRUE');
        const sRes = await (0, db_1.query)('SELECT COUNT(*) as count FROM specials WHERE is_active = TRUE');
        const catRes = await (0, db_1.query)('SELECT DISTINCT category FROM products WHERE is_active = TRUE');
        const totalProducts = parseInt(pRes.rows[0]?.count || '0', 10);
        const totalSpecials = parseInt(sRes.rows[0]?.count || '0', 10);
        const categories = ['All', ...catRes.rows.map((r) => r.category)];
        const priceRange = {
            min: Number(pRes.rows[0]?.min_price || 0),
            max: Number(pRes.rows[0]?.max_price || 0),
        };
        const stats = {
            totalProducts,
            totalSpecials,
            categories,
            priceRange,
        };
        res.json({ success: true, data: stats });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
});
