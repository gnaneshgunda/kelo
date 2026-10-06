import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBoxOpen,
  FaCalendarAlt,
  FaVoteYea,
  FaPalette,
  FaGlobe,
  FaShoppingBag,
  FaSignOutAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaEye,
  FaToggleOn,
  FaToggleOff,
  FaSync,
  FaTruck,
  FaCheckCircle,
} from 'react-icons/fa';
import { api } from '../../services/api';
import type { Product, KeloEvent, Poll, PaintingApplication, SiteSettings, AdminOrder } from '../../types';
import './AdminDashboard.css';

type ActiveTab = 'products' | 'events' | 'polls' | 'painting' | 'orders' | 'content';

export default function AdminDashboard() {
  const [tab, setTab] = useState<ActiveTab>('products');
  const navigate = useNavigate();

  // State per tab
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<KeloEvent[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [applications, setApplications] = useState<PaintingApplication[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({});

  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'>('ALL');

  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingEvent, setEditingEvent] = useState<Partial<KeloEvent> | null>(null);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollDesc, setNewPollDesc] = useState('');
  const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '']);

  // Admin voting state
  const [selectedVoteOptions, setSelectedVoteOptions] = useState<Record<string, string>>({});

  // Application filter
  const [appFilter, setAppFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL');

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // ─── Data Loading ──────────────────────────────────────────
  const loadTabContent = useCallback(async (active: ActiveTab) => {
    setLoading(true);
    try {
      if (active === 'products') {
        const data = await api.getProducts(true);
        setProducts(data);
      } else if (active === 'events') {
        const data = await api.getAdminEvents();
        setEvents(data);
      } else if (active === 'polls') {
        const data = await api.getPolls();
        setPolls(data);
      } else if (active === 'painting') {
        const data = await api.getPaintingApplications(appFilter);
        setApplications(data);
      } else if (active === 'orders') {
        const data = await api.getAdminOrders();
        setOrders(data);
      } else if (active === 'content') {
        const data = await api.getSettings();
        setSettings(data);
      }
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [appFilter]);

  useEffect(() => {
    loadTabContent(tab);
  }, [tab, loadTabContent]);

  const handleLogout = async () => {
    await api.logout();
    navigate('/admin/login');
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status);
      showFeedback(`Order #${orderId} marked as ${status}!`);
      const data = await api.getAdminOrders();
      setOrders(data);
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to update order status', 'error');
    }
  };

  // ─── 1. Product Actions ────────────────────────────────────
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name) return;

    try {
      if (editingProduct.id && products.some((p) => p.id === editingProduct.id)) {
        await api.updateProduct(editingProduct.id, editingProduct);
        showFeedback('Product updated successfully!');
      } else {
        await api.addProduct(editingProduct);
        showFeedback('New product added to catalog!');
      }
      setEditingProduct(null);
      loadTabContent('products');
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Error saving product', 'error');
    }
  };

  const handleToggleProductActive = async (p: Product) => {
    try {
      const updated = await api.updateProduct(p.id, { isActive: !p.isActive });
      setProducts((prev) => prev.map((item) => (item.id === p.id ? updated : item)));
      showFeedback(`Product ${updated.isActive ? 'enabled' : 'disabled'}`);
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to toggle product', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showFeedback('Product deleted.');
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to delete product', 'error');
    }
  };

  // ─── 2. Event Actions ──────────────────────────────────────
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editingEvent.title) return;

    try {
      if (editingEvent.id && events.some((evt) => evt.id === editingEvent.id)) {
        await api.updateEvent(editingEvent.id, editingEvent);
        showFeedback('Event updated successfully!');
      } else {
        await api.createEvent(editingEvent);
        showFeedback('New event created!');
      }
      setEditingEvent(null);
      loadTabContent('events');
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Error saving event', 'error');
    }
  };

  const handleToggleEventPublish = async (evt: KeloEvent) => {
    try {
      const updated = await api.updateEvent(evt.id, { isPublished: !evt.isPublished });
      setEvents((prev) => prev.map((e) => (e.id === evt.id ? updated : e)));
      showFeedback(`Event ${updated.isPublished ? 'published' : 'unpublished'}`);
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to toggle event', 'error');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      showFeedback('Event deleted.');
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to delete event', 'error');
    }
  };

  // ─── 3. Poll Actions & Admin Voting ────────────────────────
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOpts = newPollOptions.filter((o) => o.trim().length > 0);
    if (!newPollTitle.trim() || validOpts.length < 2) {
      showFeedback('Title and at least 2 options are required', 'error');
      return;
    }

    try {
      await api.createPoll({
        title: newPollTitle.trim(),
        description: newPollDesc.trim(),
        options: validOpts,
        isOpen: true,
      });
      showFeedback('New poll created!');
      setIsPollModalOpen(false);
      setNewPollTitle('');
      setNewPollDesc('');
      setNewPollOptions(['', '']);
      loadTabContent('polls');
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to create poll', 'error');
    }
  };

  const handleTogglePollOpen = async (poll: Poll) => {
    try {
      const updated = await api.updatePoll(poll.id, { isOpen: !poll.isOpen });
      setPolls((prev) => prev.map((p) => (p.id === poll.id ? updated : p)));
      showFeedback(`Poll is now ${updated.isOpen ? 'open' : 'closed'}`);
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to update poll', 'error');
    }
  };

  const handleAdminVote = async (pollId: string) => {
    const selectedOpt = selectedVoteOptions[pollId];
    if (!selectedOpt) {
      showFeedback('Please select an option before casting vote', 'error');
      return;
    }

    try {
      const updatedPoll = await api.voteAdmin(pollId, selectedOpt);
      setPolls((prev) => prev.map((p) => (p.id === pollId ? updatedPoll : p)));
      showFeedback('Official administrator vote recorded successfully! 🎉');
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Voting failed', 'error');
    }
  };

  const handleDeletePoll = async (id: string) => {
    if (!window.confirm('Delete this poll?')) return;
    try {
      await api.deletePoll(id);
      setPolls((prev) => prev.filter((p) => p.id !== id));
      showFeedback('Poll deleted.');
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to delete poll', 'error');
    }
  };

  // ─── 4. Painting Applications Actions ──────────────────────
  const handleUpdateAppStatus = async (id: string, status: 'PENDING' | 'ACCEPTED' | 'REJECTED') => {
    try {
      const updated = await api.updateApplicationStatus(id, status);
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showFeedback(`Application marked as ${status}`);
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to update status', 'error');
    }
  };

  // ─── 5. Content Management Actions ─────────────────────────
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      showFeedback('Website content & announcements saved!');
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to save settings', 'error');
    }
  };

  return (
    <div className="admin-dashboard-container">
      {/* Top Header */}
      <header className="admin-header">
        <div className="admin-header-title">
          <h1>KELO CMS Dashboard</h1>
          <span className="admin-active-badge">Admin Session Active</span>
        </div>
        <div className="admin-header-actions">
          <button className="btn-refresh" onClick={() => loadTabContent(tab)} title="Refresh Data">
            <FaSync />
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </header>

      {/* Global Feedback Alert */}
      {feedbackMsg && (
        <div className={`admin-feedback-banner ${feedbackMsg.type}`}>
          {feedbackMsg.text}
        </div>
      )}

      {/* Main Tab Navigation */}
      <nav className="admin-tabs-nav">
        <button
          className={`tab-btn ${tab === 'products' ? 'active' : ''}`}
          onClick={() => setTab('products')}
        >
          <FaBoxOpen /> Products ({products.length})
        </button>
        <button
          className={`tab-btn ${tab === 'events' ? 'active' : ''}`}
          onClick={() => setTab('events')}
        >
          <FaCalendarAlt /> Events ({events.length})
        </button>
        <button
          className={`tab-btn ${tab === 'polls' ? 'active' : ''}`}
          onClick={() => setTab('polls')}
        >
          <FaVoteYea /> Polling Contests ({polls.length})
        </button>
        <button
          className={`tab-btn ${tab === 'painting' ? 'active' : ''}`}
          onClick={() => setTab('painting')}
        >
          <FaPalette /> Painting Applications ({applications.length})
        </button>
        <button
          className={`tab-btn ${tab === 'orders' ? 'active' : ''}`}
          onClick={() => setTab('orders')}
        >
          <FaShoppingBag /> Customer Orders ({orders.length})
        </button>
        <button
          className={`tab-btn ${tab === 'content' ? 'active' : ''}`}
          onClick={() => setTab('content')}
        >
          <FaGlobe /> Website Content
        </button>
      </nav>

      {/* Tab Content Panes */}
      <main className="admin-main-pane">
        {loading && <div className="admin-loading-spinner">Fetching database records...</div>}

        {/* ════════════ 1. PRODUCTS TAB ════════════ */}
        {tab === 'products' && (
          <div className="tab-pane">
            <div className="pane-header-row">
              <div>
                <h2>Product Inventory & Storefront Items</h2>
                <p>Manage items available in the customer shop. Toggle enable/disable to control visibility.</p>
              </div>
              <button
                className="btn-add-primary"
                onClick={() =>
                  setEditingProduct({
                    id: `p_${Date.now()}`,
                    name: '',
                    description: '',
                    price: 399,
                    category: 'Decor',
                    imageUrl: 'https://res.cloudinary.com/zo7u3tba/image/upload/v1787248483/Heart-frame.jpg',
                    isActive: true,
                  })
                }
              >
                <FaPlus /> Add New Product
              </button>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="product-title-cell">
                        <img src={p.imageUrl} alt={p.name} className="table-thumb" />
                        <div>
                          <strong>{p.name}</strong>
                          <span className="prod-id-tag">ID: {p.id}</span>
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td>₹{Number(p.price).toFixed(2)}</td>
                      <td>
                        <button
                          className={`btn-toggle-status ${p.isActive ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleProductActive(p)}
                        >
                          {p.isActive ? <FaToggleOn /> : <FaToggleOff />}
                          <span>{p.isActive ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td>
                        <div className="table-actions-row">
                          <button className="btn-edit" onClick={() => setEditingProduct(p)} title="Edit">
                            <FaEdit />
                          </button>
                          <button className="btn-delete" onClick={() => handleDeleteProduct(p.id)} title="Delete">
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════ 2. EVENTS TAB ════════════ */}
        {tab === 'events' && (
          <div className="tab-pane">
            <div className="pane-header-row">
              <div>
                <h2>Campus Events & Hall Days</h2>
                <p>Publish workshops, hall days, and festivals for public visitors.</p>
              </div>
              <button
                className="btn-add-primary"
                onClick={() =>
                  setEditingEvent({
                    title: '',
                    description: '',
                    dateTime: 'March 25, 2026 • 5:00 PM',
                    location: 'IIT Kharagpur Campus',
                    bannerUrl: 'https://res.cloudinary.com/zo7u3tba/image/upload/v1787248483/Heart-frame.jpg',
                    eventType: 'hall_day',
                    isPublished: true,
                  })
                }
              >
                <FaPlus /> Create Event
              </button>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Type</th>
                    <th>Date & Location</th>
                    <th>Visibility</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((evt) => (
                    <tr key={evt.id}>
                      <td>
                        <strong>{evt.title}</strong>
                        <p className="table-sub-desc">{evt.description.slice(0, 60)}...</p>
                      </td>
                      <td>
                        <span className="event-type-badge">{evt.eventType}</span>
                      </td>
                      <td>
                        <div>{evt.dateTime}</div>
                        <small className="location-small">{evt.location}</small>
                      </td>
                      <td>
                        <button
                          className={`btn-toggle-status ${evt.isPublished ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleEventPublish(evt)}
                        >
                          {evt.isPublished ? <FaEye /> : <FaTimes />}
                          <span>{evt.isPublished ? 'Published' : 'Draft'}</span>
                        </button>
                      </td>
                      <td>
                        <div className="table-actions-row">
                          <button className="btn-edit" onClick={() => setEditingEvent(evt)}>
                            <FaEdit />
                          </button>
                          <button className="btn-delete" onClick={() => handleDeleteEvent(evt.id)}>
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════ 3. POLLS TAB (ADMIN-ONLY VOTING) ════════════ */}
        {tab === 'polls' && (
          <div className="tab-pane">
            <div className="pane-header-row">
              <div>
                <h2>Administrative Polling Contests</h2>
                <p>
                  <strong>Security Note:</strong> Only administrators can vote. Public visitors only see read-only results.
                </p>
              </div>
              <button className="btn-add-primary" onClick={() => setIsPollModalOpen(true)}>
                <FaPlus /> Create Poll
              </button>
            </div>

            <div className="polls-admin-grid">
              {polls.map((poll) => {
                const total = poll.totalVotes || 0;
                return (
                  <div key={poll.id} className="admin-poll-card">
                    <div className="poll-card-top">
                      <h3>{poll.title}</h3>
                      <button
                        className={`btn-poll-open-toggle ${poll.isOpen ? 'open' : 'closed'}`}
                        onClick={() => handleTogglePollOpen(poll)}
                      >
                        {poll.isOpen ? 'Poll Open' : 'Poll Closed'}
                      </button>
                    </div>

                    {poll.description && <p className="admin-poll-desc">{poll.description}</p>}

                    {/* Official Admin Voting Panel */}
                    <div className="admin-voting-fieldset">
                      <h4>🗳️ Cast Official Administrator Vote</h4>
                      {poll.isOpen ? (
                        <div className="vote-options-picker">
                          {poll.options.map((opt) => (
                            <label key={opt.id} className="vote-opt-radio-row">
                              <input
                                type="radio"
                                name={`vote_${poll.id}`}
                                value={opt.id}
                                checked={selectedVoteOptions[poll.id] === opt.id}
                                onChange={() =>
                                  setSelectedVoteOptions((prev) => ({ ...prev, [poll.id]: opt.id }))
                                }
                              />
                              <span className="radio-opt-label">{opt.optionText}</span>
                              <span className="radio-opt-votes">({opt.votes} votes)</span>
                            </label>
                          ))}
                          <button
                            className="btn-cast-vote"
                            disabled={!selectedVoteOptions[poll.id]}
                            onClick={() => handleAdminVote(poll.id)}
                          >
                            Submit Admin Vote
                          </button>
                        </div>
                      ) : (
                        <p className="poll-closed-notice">Voting is currently closed for this contest.</p>
                      )}
                    </div>

                    {/* Live Results Bar Tally */}
                    <div className="poll-tally-section">
                      <h5>Current Results ({total} total votes)</h5>
                      {poll.options.map((opt) => {
                        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                        return (
                          <div key={opt.id} className="tally-row">
                            <div className="tally-labels">
                              <span>{opt.optionText}</span>
                              <strong>
                                {opt.votes} ({pct}%)
                              </strong>
                            </div>
                            <div className="tally-bar-track">
                              <div className="tally-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="poll-card-footer">
                      <button className="btn-delete-poll" onClick={() => handleDeletePoll(poll.id)}>
                        <FaTrash /> Delete Contest
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════ 4. PAINTING APPLICATIONS TAB ════════════ */}
        {tab === 'painting' && (
          <div className="tab-pane">
            <div className="pane-header-row">
              <div>
                <h2>Painting Competition Applications</h2>
                <p>Participant entries submitted via the public Events page (NO artwork uploads).</p>
              </div>
              <div className="app-filter-tabs">
                {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    className={`filter-badge ${appFilter === st ? 'active' : ''}`}
                    onClick={() => setAppFilter(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>College Info</th>
                    <th>Category & Concept</th>
                    <th>Status</th>
                    <th>Review Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No participant applications found for filter: {appFilter}
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <strong>{app.fullName}</strong>
                          <div className="contact-small">
                            📞 {app.phone} <br />
                            ✉️ {app.email}
                          </div>
                        </td>
                        <td>
                          <div>Roll: <strong>{app.rollNumber}</strong></div>
                          <div className="college-small">{app.department}</div>
                          <div className="college-small">🏛️ {app.hall}</div>
                        </td>
                        <td>
                          <span className="category-pill">{app.paintingCategory}</span>
                          <p className="app-concept-text">{app.description}</p>
                        </td>
                        <td>
                          <span className={`status-badge ${app.status.toLowerCase()}`}>
                            {app.status}
                          </span>
                        </td>
                        <td>
                          <div className="app-review-actions">
                            {app.status !== 'ACCEPTED' && (
                              <button
                                className="btn-accept"
                                onClick={() => handleUpdateAppStatus(app.id, 'ACCEPTED')}
                                title="Approve participant"
                              >
                                <FaCheck /> Accept
                              </button>
                            )}
                            {app.status !== 'REJECTED' && (
                              <button
                                className="btn-reject"
                                onClick={() => handleUpdateAppStatus(app.id, 'REJECTED')}
                                title="Reject participant"
                              >
                                <FaTimes /> Reject
                              </button>
                            )}
                            {app.status !== 'PENDING' && (
                              <button
                                className="btn-pending-reset"
                                onClick={() => handleUpdateAppStatus(app.id, 'PENDING')}
                                title="Reset status"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════ 5. ORDERS MANAGEMENT TAB ════════════ */}
        {tab === 'orders' && (
          <div className="tab-pane">
            <div className="pane-header-row">
              <div>
                <h2>Customer Orders & Fulfillment</h2>
                <p>View checkout submissions, manage fulfillment, and update order statuses.</p>
              </div>
              <div className="app-filter-pills">
                {(['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map((st) => (
                  <button
                    key={st}
                    className={`filter-pill ${orderFilter === st ? 'active' : ''}`}
                    onClick={() => setOrderFilter(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Contact & Address</th>
                    <th>Items Purchased</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Fulfillment Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .filter((o) => orderFilter === 'ALL' || o.status === orderFilter)
                    .map((o) => (
                      <tr key={o.id}>
                        <td>
                          <strong>#ORD-{String(o.id).padStart(4, '0')}</strong>
                          <div className="table-sub-desc">
                            {new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          <strong>{o.customerName}</strong>
                          {o.email && (
                            <div className="table-sub-desc">
                              <a href={`mailto:${o.email}`}>{o.email}</a>
                            </div>
                          )}
                        </td>
                        <td>
                          <div><strong>📞 <a href={`tel:${o.phone}`}>{o.phone}</a></strong></div>
                          <div className="table-sub-desc" style={{ maxWidth: '200px' }}>
                            {o.shippingAddress || 'IIT Kharagpur Campus Delivery'}
                          </div>
                        </td>
                        <td>
                          <div className="order-items-summary-list">
                            {Array.isArray(o.items) && o.items.length > 0 ? (
                              o.items.map((item, idx) => (
                                <div key={idx} className="order-item-chip">
                                  <span>{item.name || item.id}</span>
                                  <span className="order-item-qty">×{item.quantity}</span>
                                  {item.price ? <span className="order-item-price">₹{(item.price * item.quantity).toFixed(2)}</span> : null}
                                </div>
                              ))
                            ) : (
                              <span>No items</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <strong className="order-total-highlight">₹{Number(o.totalAmount).toFixed(2)}</strong>
                        </td>
                        <td>
                          <span className={`order-status-badge ${o.status.toLowerCase()}`}>
                            {o.status}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions-row">
                            {o.status === 'PENDING' && (
                              <button
                                className="btn-order-action confirm"
                                onClick={() => handleUpdateOrderStatus(o.id, 'CONFIRMED')}
                                title="Confirm this order"
                              >
                                <FaCheckCircle /> Confirm
                              </button>
                            )}
                            {o.status === 'CONFIRMED' && (
                              <button
                                className="btn-order-action ship"
                                onClick={() => handleUpdateOrderStatus(o.id, 'SHIPPED')}
                                title="Mark as dispatched / shipped"
                              >
                                <FaTruck /> Ship
                              </button>
                            )}
                            {o.status === 'SHIPPED' && (
                              <button
                                className="btn-order-action deliver"
                                onClick={() => handleUpdateOrderStatus(o.id, 'DELIVERED')}
                                title="Mark as delivered"
                              >
                                <FaCheck /> Delivered
                              </button>
                            )}
                            {o.status !== 'CANCELLED' && o.status !== 'DELIVERED' && (
                              <button
                                className="btn-order-action cancel"
                                onClick={() => handleUpdateOrderStatus(o.id, 'CANCELLED')}
                                title="Cancel order"
                              >
                                <FaTimes />
                              </button>
                            )}
                            <select
                              className="order-status-select"
                              value={o.status}
                              onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                              title="Manually override status"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {orders.filter((o) => orderFilter === 'ALL' || o.status === orderFilter).length === 0 && (
                    <tr>
                      <td colSpan={7} className="table-empty-row">
                        No orders found in "{orderFilter}" status.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════ 6. WEBSITE CONTENT MANAGEMENT TAB ════════════ */}
        {tab === 'content' && (
          <div className="tab-pane">
            <div className="pane-header-row">
              <div>
                <h2>Website Content & Announcements</h2>
                <p>Modify storefront banners, hero notices, and contact info without touching source code.</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="settings-form-panel">
              <div className="form-field">
                <label>Top Announcement Banner Text</label>
                <input
                  type="text"
                  value={settings.announcementText || ''}
                  onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                  placeholder="e.g. ✨ Handcrafted Gifts & Artisanal Crafts"
                />
              </div>

              <div className="form-field">
                <label>Announcement Subtext / Shipping Promotion</label>
                <input
                  type="text"
                  value={settings.announcementSubtext || ''}
                  onChange={(e) => setSettings({ ...settings, announcementSubtext: e.target.value })}
                  placeholder="e.g. Free Shipping on Orders Over ₹500"
                />
              </div>

              <div className="form-field-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.isAnnouncementActive !== false}
                    onChange={(e) => setSettings({ ...settings, isAnnouncementActive: e.target.checked })}
                  />
                  <span>Show Announcement Banner on Storefront</span>
                </label>
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label>Official Contact Email</label>
                  <input
                    type="email"
                    value={settings.contactEmail || ''}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>Instagram Handle</label>
                  <input
                    type="text"
                    value={settings.instagramHandle || ''}
                    onChange={(e) => setSettings({ ...settings, instagramHandle: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn-save-settings">
                Save Website Settings
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ── Modal: Product Add/Edit ── */}
      {editingProduct && (
        <div className="admin-modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{editingProduct.id && products.some((p) => p.id === editingProduct.id) ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSaveProduct} className="modal-crud-form">
              <div className="form-field">
                <label>Product Name</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  />
                </div>
                <div className="form-field">
                  <label>Category</label>
                  <select
                    value={editingProduct.category || 'Decor'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  >
                    <option value="Decor">Decor</option>
                    <option value="Frames">Frames</option>
                    <option value="Hampers">Hampers</option>
                    <option value="Combos">Combos</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label>Image URL (Cloudinary or Web)</label>
                <input
                  type="url"
                  required
                  value={editingProduct.imageUrl || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                />
              </div>

              <div className="modal-actions-bar">
                <button type="button" className="btn-cancel" onClick={() => setEditingProduct(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Event Add/Edit ── */}
      {editingEvent && (
        <div className="admin-modal-overlay" onClick={() => setEditingEvent(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{editingEvent.id ? 'Edit Event' : 'Create New Event'}</h3>
            <form onSubmit={handleSaveEvent} className="modal-crud-form">
              <div className="form-field">
                <label>Event Title</label>
                <input
                  type="text"
                  required
                  value={editingEvent.title || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                />
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label>Event Type</label>
                  <select
                    value={editingEvent.eventType || 'hall_day'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, eventType: e.target.value as KeloEvent['eventType'] })}
                  >
                    <option value="hall_day">Hall Day & Festival</option>
                    <option value="poll">Polling Contest</option>
                    <option value="painting_competition">Painting Competition</option>
                    <option value="general">General Campus Event</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Date & Time</label>
                  <input
                    type="text"
                    required
                    value={editingEvent.dateTime || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, dateTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Location / Venue</label>
                <input
                  type="text"
                  required
                  value={editingEvent.location || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Banner Image URL</label>
                <input
                  type="url"
                  value={editingEvent.bannerUrl || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, bannerUrl: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Description</label>
                <textarea
                  rows={3}
                  required
                  value={editingEvent.description || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                />
              </div>

              <div className="modal-actions-bar">
                <button type="button" className="btn-cancel" onClick={() => setEditingEvent(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Create Poll ── */}
      {isPollModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsPollModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Create Polling Contest</h3>
            <form onSubmit={handleCreatePoll} className="modal-crud-form">
              <div className="form-field">
                <label>Poll Title / Question</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Which handcrafted item should headline the Hall Day stall?"
                  value={newPollTitle}
                  onChange={(e) => setNewPollTitle(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional context about this voting contest..."
                  value={newPollDesc}
                  onChange={(e) => setNewPollDesc(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Poll Options (At least 2)</label>
                {newPollOptions.map((opt, idx) => (
                  <div key={idx} className="poll-option-input-row">
                    <input
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const copy = [...newPollOptions];
                        copy[idx] = e.target.value;
                        setNewPollOptions(copy);
                      }}
                    />
                    {newPollOptions.length > 2 && (
                      <button
                        type="button"
                        className="btn-remove-opt"
                        onClick={() => setNewPollOptions(newPollOptions.filter((_, i) => i !== idx))}
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-add-opt"
                  onClick={() => setNewPollOptions([...newPollOptions, ''])}
                >
                  + Add Another Option
                </button>
              </div>

              <div className="modal-actions-bar">
                <button type="button" className="btn-cancel" onClick={() => setIsPollModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Contest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
