import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';
import { OrderItem } from '../types';

export const ordersRouter = Router();

// POST /api/checkout - Customer checkout
ordersRouter.post('/checkout', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phoneno, phone, phoneNumber, mobile, shipping_address, address, cart, product_ids } = req.body;

    const contactPhone = phoneno || phone || phoneNumber || mobile;
    if (!contactPhone || typeof contactPhone !== 'string' || !contactPhone.trim()) {
      res.status(400).json({ success: false, error: 'Phone number is required for order delivery' });
      return;
    }

    const customerName = (name && name.trim()) || 'Valued Customer';
    const deliveryAddress = shipping_address || address || 'IIT Kharagpur Campus Delivery';

    // Parse cart items
    let rawItems: Array<{ id: string; quantity: number }> = [];

    if (Array.isArray(cart) && cart.length > 0) {
      rawItems = cart.map((item: any) => ({
        id: item.id || item.product?.id,
        quantity: Number(item.quantity) || 1,
      })).filter((i: any) => Boolean(i.id));
    } else if (Array.isArray(product_ids) && product_ids.length > 0) {
      rawItems = product_ids.map((id: string) => ({ id, quantity: 1 }));
    }

    if (rawItems.length === 0) {
      res.status(400).json({ success: false, error: 'Cart items or product_ids are required' });
      return;
    }

    // Lookup prices from database to calculate server-side total
    const itemIds = rawItems.map((i) => i.id);
    const placeholders = itemIds.map((_, idx) => `$${idx + 1}`).join(',');
    const prodRes = await query(`SELECT id, name, price FROM products WHERE id IN (${placeholders})`, itemIds);
    const specRes = await query(`SELECT id, name, price FROM specials WHERE id IN (${placeholders})`, itemIds);

    const priceMap = new Map<string, { name: string; price: number }>();
    for (const r of prodRes.rows) priceMap.set(r.id, { name: r.name, price: Number(r.price) });
    for (const r of specRes.rows) priceMap.set(r.id, { name: r.name, price: Number(r.price) });

    let calculatedTotal = 0;
    const orderItems: OrderItem[] = [];
    const itemSummaries: string[] = [];

    for (const item of rawItems) {
      const match = priceMap.get(item.id);
      const price = match ? match.price : 0;
      const itemName = match ? match.name : `Product ${item.id}`;
      calculatedTotal += price * item.quantity;

      orderItems.push({
        id: item.id,
        name: itemName,
        price,
        quantity: item.quantity,
      });

      itemSummaries.push(`${itemName} (${item.id} × ${item.quantity} = ₹${price * item.quantity})`);
    }

    const insertSql = `
      INSERT INTO orders (customer_name, email, phone, shipping_address, items, total_amount, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
      RETURNING *
    `;

    const result = await query(insertSql, [
      customerName,
      email || null,
      contactPhone.trim(),
      deliveryAddress,
      JSON.stringify(orderItems),
      calculatedTotal,
    ]);

    const orderRow = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Order created successfully and recorded in database',
      orderId: orderRow.id,
      calculatedTotal,
      order: {
        orderid: orderRow.id,
        name: orderRow.customer_name,
        email: orderRow.email || '',
        phoneno: orderRow.phone,
        product_ids: itemSummaries.join(', '),
        total_amount: Number(orderRow.total_amount),
        status: orderRow.status,
        shipping_address: orderRow.shipping_address,
        created_at: orderRow.created_at,
      },
    });
  } catch (err: any) {
    console.error('[Checkout Error]', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to process checkout' });
  }
});

// GET /api/admin/orders (Admin Only)
ordersRouter.get('/admin/orders', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = result.rows.map((row: any) => ({
      id: row.id,
      customerName: row.customer_name,
      email: row.email,
      phone: row.phone,
      shippingAddress: row.shipping_address,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
      totalAmount: Number(row.total_amount),
      status: row.status,
      createdAt: row.created_at,
    }));
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve orders' });
  }
});

// PATCH /api/admin/orders/:id (Admin Only)
ordersRouter.patch('/admin/orders/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid order status' });
      return;
    }

    const result = await query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    res.json({ success: true, message: 'Order status updated', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
});
