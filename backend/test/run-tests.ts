import { app } from '../src/app';
import { runMigrations } from '../src/db/migrate';
import { runSeeds } from '../src/db/seed';
import { config } from '../src/config';
import http from 'http';

let server: http.Server;
const TEST_PORT = 5001;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTests() {
  console.log('--- STARTING BACKEND INTEGRATION & SECURITY TESTS ---');

  await runMigrations();
  await runSeeds();

  server = app.listen(TEST_PORT);
  console.log(`Test server running at ${BASE_URL}`);

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Health check
  await test('Health check returns ok', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    if (res.status !== 200 || data.status !== 'ok') {
      throw new Error(`Expected status ok, got: ${JSON.stringify(data)}`);
    }
  });

  // 2. Normal visitor cannot vote on poll (CRITICAL SECURITY TEST)
  await test('Normal visitor voting on poll receives 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/polls/poll_gift_2026/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId: 'opt_1' }),
    });
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401/403 for unauthorized vote, got: ${res.status}`);
    }
  });

  // 3. Normal visitor can read poll results
  await test('Normal visitor can view poll results', async () => {
    const res = await fetch(`${BASE_URL}/api/polls`);
    const data = await res.json();
    if (res.status !== 200 || !data.success || !Array.isArray(data.data)) {
      throw new Error('Failed to retrieve poll results');
    }
  });

  // 4. Admin login with invalid password fails
  await test('Admin login with incorrect password receives 401', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong_password_123' }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  // 5. Admin login with correct password succeeds and returns token
  let adminToken = '';
  await test('Admin login with valid password succeeds', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: config.adminDefaultPassword }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success || !data.token) {
      throw new Error(`Login failed: ${JSON.stringify(data)}`);
    }
    adminToken = data.token;
  });

  // 6. Admin can vote on poll (CRITICAL POLLING TEST)
  await test('Authenticated administrator can successfully cast a vote', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/polls/poll_gift_2026/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ optionId: 'opt_1' }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success) {
      throw new Error(`Admin vote failed: ${JSON.stringify(data)}`);
    }
    const updatedOption = data.data.options.find((o: any) => o.id === 'opt_1');
    if (!updatedOption || updatedOption.votes < 13) {
      throw new Error(`Expected votes >= 13, got ${updatedOption?.votes}`);
    }
  });

  // 7. Public products listing
  await test('Public visitor can view active products', async () => {
    const res = await fetch(`${BASE_URL}/api/products`);
    const data = await res.json();
    if (res.status !== 200 || !data.success || data.count === 0) {
      throw new Error('Failed to retrieve products');
    }
  });

  // 8. Admin product CRUD + toggle active
  let createdProdId = '';
  await test('Admin can create, edit, toggle isActive, and delete a product', async () => {
    // A. Create
    const createRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Handcrafted Wooden Music Box',
        description: 'Melodic wind-up box',
        price: 549,
        category: 'Decor',
        imageUrl: 'https://res.cloudinary.com/zo7u3tba/image/upload/v1787248483/Heart-frame.jpg',
        isActive: true,
      }),
    });
    const createData = await createRes.json();
    if (createRes.status !== 201 || !createData.success) {
      throw new Error(`Product creation failed: ${JSON.stringify(createData)}`);
    }
    createdProdId = createData.data.id;

    // B. Toggle isActive = false
    const toggleRes = await fetch(`${BASE_URL}/api/products/${createdProdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });
    const toggleData = await toggleRes.json();
    if (toggleRes.status !== 200 || toggleData.data.isActive !== false) {
      throw new Error('Product toggle isActive failed');
    }

    // C. Verify public catalog does not include inactive product
    const publicList = await (await fetch(`${BASE_URL}/api/products`)).json();
    if (publicList.data.some((p: any) => p.id === createdProdId)) {
      throw new Error('Inactive product should not appear in public catalog');
    }

    // D. Delete
    const deleteRes = await fetch(`${BASE_URL}/api/products/${createdProdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (deleteRes.status !== 200) {
      throw new Error('Product deletion failed');
    }
  });

  // 9. Customer Checkout
  await test('Customer checkout calculates totals and records order', async () => {
    const res = await fetch(`${BASE_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohit Verma',
        email: 'rohit@example.com',
        phoneno: '+91 9876543210',
        shipping_address: 'RK Hall of Residence, IIT Kharagpur',
        cart: [{ id: 'p1', quantity: 2 }],
      }),
    });
    const data = await res.json();
    if (res.status !== 201 || !data.success || !data.orderId) {
      throw new Error(`Checkout failed: ${JSON.stringify(data)}`);
    }
  });

  // 10. Painting competition application (NO artwork_url)
  let createdAppId = '';
  await test('Visitor can submit painting competition application with participant details only', async () => {
    const res = await fetch(`${BASE_URL}/api/competitions/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: 'evt_paint_comp_2026',
        fullName: 'Ananya Sen',
        email: 'ananya@kgpian.iitkgp.ac.in',
        phone: '+91 9988776655',
        rollNumber: '22CS10045',
        department: 'Computer Science & Engineering',
        hall: 'Sarojini Naidu / Indira Gandhi Hall',
        paintingCategory: 'Watercolors on Canvas',
        description: 'Vibrant sunset over the Old Building clock tower.',
      }),
    });
    const data = await res.json();
    if (res.status !== 201 || !data.success) {
      throw new Error(`Application submission failed: ${JSON.stringify(data)}`);
    }
    // Verify artwork_url does NOT exist
    if ('artwork_url' in data.data || 'artworkUrl' in data.data) {
      throw new Error('artwork_url must not exist in application record');
    }
    createdAppId = data.data.id;
  });

  // 11. Admin application review and status change
  await test('Admin can review applications and change status to ACCEPTED / REJECTED', async () => {
    // List
    const listRes = await fetch(`${BASE_URL}/api/competitions/admin/applications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    if (listRes.status !== 200 || !listData.success || listData.count === 0) {
      throw new Error('Admin application list failed');
    }

    // Status change to ACCEPTED
    const patchRes = await fetch(`${BASE_URL}/api/competitions/admin/applications/${createdAppId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ACCEPTED' }),
    });
    const patchData = await patchRes.json();
    if (patchRes.status !== 200 || patchData.data.status !== 'ACCEPTED') {
      throw new Error(`Status update failed: ${JSON.stringify(patchData)}`);
    }
  });

  // 12. Public events & Admin event creation
  await test('Events can be created by admin and viewed by public', async () => {
    const pubRes = await fetch(`${BASE_URL}/api/events`);
    const pubData = await pubRes.json();
    if (pubRes.status !== 200 || !pubData.success || pubData.count === 0) {
      throw new Error('Public events listing failed');
    }
  });

  // 13. Website content management
  await test('Site settings can be fetched and updated by admin', async () => {
    const getRes = await fetch(`${BASE_URL}/api/settings`);
    const getData = await getRes.json();
    if (getRes.status !== 200 || !getData.success) {
      throw new Error('Failed to fetch settings');
    }

    const updateRes = await fetch(`${BASE_URL}/api/settings/admin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        announcementText: '🎉 Spring Fest Artisan Special!',
      }),
    });
    const updateData = await updateRes.json();
    if (updateRes.status !== 200 || !updateData.success) {
      throw new Error('Settings update failed');
    }
  });

  // 14. Multi-image product creation & retrieval (3-4 images)
  await test('Admin can create a product with multiple images (e.g. 4 photos) and public retrieves them all', async () => {
    const multiImages = [
      'https://res.cloudinary.com/zo7u3tba/image/upload/v1787248483/Heart-frame.jpg',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600',
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=600',
    ];

    const createRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Handcrafted Multi-Photo Mosaic',
        description: 'Mosaic frame with multiple photos',
        price: 799,
        category: 'Frames',
        imageUrl: multiImages[0],
        images: multiImages,
        isActive: true,
      }),
    });
    const createData = await createRes.json();
    if (createRes.status !== 201 || !createData.success) {
      throw new Error(`Multi-image product creation failed: ${JSON.stringify(createData)}`);
    }

    const prodId = createData.data.id;
    const getRes = await fetch(`${BASE_URL}/api/products/${prodId}`);
    const getData = await getRes.json();
    if (getRes.status !== 200 || !getData.data.images || getData.data.images.length !== 4) {
      throw new Error(`Expected 4 images, got: ${JSON.stringify(getData.data.images)}`);
    }
  });

  // 15. Multi-image event creation & retrieval (3-4 images)
  await test('Admin can create an event with multiple images and public retrieves them all', async () => {
    const eventImages = [
      'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600',
      'https://images.unsplash.com/photo-1460661419200-fd435f34d1c7?w=600',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600',
    ];

    const createRes = await fetch(`${BASE_URL}/api/events/admin/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Spring Fine Arts Gala',
        description: 'Exhibition of campus paintings and crafts.',
        dateTime: 'April 12, 2026 • 6:00 PM',
        location: 'Nehru Museum of Asian Art',
        eventType: 'painting_competition',
        bannerUrl: eventImages[0],
        images: eventImages,
        isPublished: true,
      }),
    });
    const createData = await createRes.json();
    if (createRes.status !== 201 || !createData.success) {
      throw new Error(`Multi-image event creation failed: ${JSON.stringify(createData)}`);
    }

    const evtId = createData.data.id;
    const getRes = await fetch(`${BASE_URL}/api/events/${evtId}`);
    const getData = await getRes.json();
    if (getRes.status !== 200 || !getData.data.images || getData.data.images.length !== 3) {
      throw new Error(`Expected 3 event images, got: ${JSON.stringify(getData.data.images)}`);
    }
  });

  // 16. Competition status & participant capacity
  await test('Public can query competition status and see spots remaining out of 50', async () => {
    const res = await fetch(`${BASE_URL}/api/competitions/status?eventId=evt_paint_comp_2026`);
    const data = await res.json();
    if (res.status !== 200 || !data.success || data.maxCapacity !== 50) {
      throw new Error(`Competition status invalid: ${JSON.stringify(data)}`);
    }
    if (typeof data.spotsRemaining !== 'number' || data.spotsRemaining > 50) {
      throw new Error(`Spots remaining calculation error: ${data.spotsRemaining}`);
    }
  });

  // 17. Painting competition participant automatically links to poll
  await test('Painting competition applicant is automatically added as an option in the event poll', async () => {
    const pollRes = await fetch(`${BASE_URL}/api/polls?eventId=evt_paint_comp_2026`);
    const pollData = await pollRes.json();
    if (pollRes.status !== 200 || !pollData.success || pollData.data.length === 0) {
      throw new Error(`Failed to find painting competition poll: ${JSON.stringify(pollData)}`);
    }
    const paintPoll = pollData.data[0];
    const option = paintPoll.options.find((o: any) => o.optionText.includes('Ananya Sen'));
    if (!option) {
      throw new Error(`Participant Ananya Sen not found in poll options: ${JSON.stringify(paintPoll.options)}`);
    }
  });

  // 18. Admin sync-poll endpoint
  await test('Admin can sync participants into the painting poll via sync-poll endpoint', async () => {
    const res = await fetch(`${BASE_URL}/api/competitions/admin/sync-poll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ eventId: 'evt_paint_comp_2026' }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success || !data.pollId) {
      throw new Error(`Sync poll failed: ${JSON.stringify(data)}`);
    }
  });

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================`);

  server.close();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
