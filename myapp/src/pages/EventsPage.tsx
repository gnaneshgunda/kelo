import { useState, useEffect } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaVoteYea, FaPalette, FaLock } from 'react-icons/fa';
import { api } from '../services/api';
import type { KeloEvent, Poll } from '../types';
import PaintingApplicationModal from '../components/PaintingApplicationModal';
import './EventsPage.css';

export default function EventsPage() {
  const [events, setEvents] = useState<KeloEvent[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [activeModalEvent, setActiveModalEvent] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    async function loadEventData() {
      try {
        setLoading(true);
        const [fetchedEvents, fetchedPolls] = await Promise.all([
          api.getEvents(),
          api.getPolls(),
        ]);
        setEvents(fetchedEvents);
        setPolls(fetchedPolls);
      } catch (err) {
        console.error('[EventsPage] Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    }

    loadEventData();
  }, []);

  const filteredEvents = events.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'hall_day') return e.eventType === 'hall_day';
    if (filter === 'poll') return e.eventType === 'poll';
    if (filter === 'painting_competition') return e.eventType === 'painting_competition';
    return true;
  });

  return (
    <div className="events-container">
      {/* Hero Header */}
      <div className="events-hero">
        <span className="events-badge">Campus Gatherings & Contests</span>
        <h1>Hall Days & Campus Events</h1>
        <p className="events-sub">
          Discover college festivals, artisan showcases, administrative polling contests, and painting competitions crafted at IIT Kharagpur.
        </p>
      </div>

      {/* Filter Navigation */}
      <div className="events-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Events
        </button>
        <button
          className={`filter-btn ${filter === 'hall_day' ? 'active' : ''}`}
          onClick={() => setFilter('hall_day')}
        >
          Hall Days & Festivals
        </button>
        <button
          className={`filter-btn ${filter === 'poll' ? 'active' : ''}`}
          onClick={() => setFilter('poll')}
        >
          Polling Contests
        </button>
        <button
          className={`filter-btn ${filter === 'painting_competition' ? 'active' : ''}`}
          onClick={() => setFilter('painting_competition')}
        >
          Painting Competitions
        </button>
      </div>

      {loading ? (
        <div className="events-loading">
          <div className="spinner"></div>
          <p>Loading campus events and polling contests...</p>
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.length === 0 ? (
            <div className="no-events-card">
              <p>No events found for this category at the moment. Stay tuned!</p>
            </div>
          ) : (
            filteredEvents.map((evt) => {
              // Check if event is linked to a poll
              const linkedPoll = evt.eventType === 'poll'
                ? polls.find((p) => p.eventId === evt.id) || polls[0]
                : null;

              return (
                <article key={evt.id} className={`event-card ${evt.eventType}`}>
                  {evt.bannerUrl && (
                    <div className="event-banner-wrap">
                      <img src={evt.bannerUrl} alt={evt.title} className="event-banner-img" />
                      <span className={`event-type-tag ${evt.eventType}`}>
                        {evt.eventType === 'painting_competition' && '🎨 Painting Contest'}
                        {evt.eventType === 'poll' && '📊 Polling Contest'}
                        {evt.eventType === 'hall_day' && '🏛️ Hall Day Special'}
                        {evt.eventType === 'general' && '✨ Special Event'}
                      </span>
                    </div>
                  )}

                  <div className="event-card-body">
                    <h2 className="event-title">{evt.title}</h2>
                    <p className="event-description">{evt.description}</p>

                    <div className="event-meta">
                      <div className="meta-item">
                        <FaCalendarAlt className="meta-icon" />
                        <span>{evt.dateTime}</span>
                      </div>
                      <div className="meta-item">
                        <FaMapMarkerAlt className="meta-icon" />
                        <span>{evt.location}</span>
                      </div>
                    </div>

                    {/* ─── Painting Competition Card Action ─── */}
                    {evt.eventType === 'painting_competition' && (
                      <div className="event-action-box painting-box">
                        <p className="action-hint">
                          Open to all campus students. Express your creativity on canvas and win festive gift hampers!
                        </p>
                        <button
                          className="btn-apply-painting"
                          onClick={() => setActiveModalEvent({ id: evt.id, title: evt.title })}
                        >
                          <FaPalette /> Apply to Participate
                        </button>
                      </div>
                    )}

                    {/* ─── Polling Contest Card: Read-Only Results for Normal Visitors ─── */}
                    {evt.eventType === 'poll' && linkedPoll && (
                      <div className="event-poll-box">
                        <div className="poll-header-row">
                          <span className="poll-badge">
                            <FaVoteYea /> {linkedPoll.isOpen ? 'Poll Active' : 'Poll Closed'}
                          </span>
                          <span className="poll-admin-badge" title="Voting restricted to administrators">
                            <FaLock /> Admin-Only Voting
                          </span>
                        </div>

                        <h4 className="poll-title">{linkedPoll.title}</h4>
                        {linkedPoll.description && (
                          <p className="poll-desc">{linkedPoll.description}</p>
                        )}

                        {/* Poll Results Display */}
                        <div className="poll-results-list">
                          {linkedPoll.options.map((opt) => {
                            const total = linkedPoll.totalVotes || 1;
                            const pct = Math.round((opt.votes / (total || 1)) * 100);

                            return (
                              <div key={opt.id} className="poll-result-bar-wrap">
                                <div className="poll-opt-labels">
                                  <span className="poll-opt-text">{opt.optionText}</span>
                                  <span className="poll-opt-tally">
                                    <strong>{opt.votes}</strong> votes ({pct}%)
                                  </span>
                                </div>
                                <div className="poll-progress-track">
                                  <div
                                    className="poll-progress-fill"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="poll-footer-note">
                          <span>
                            Total Votes: <strong>{linkedPoll.totalVotes || 0}</strong>
                          </span>
                          <span className="visitor-note">
                            👁️ Public results view. Official votes recorded by administration.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* Painting Application Modal */}
      {activeModalEvent && (
        <PaintingApplicationModal
          eventId={activeModalEvent.id}
          eventTitle={activeModalEvent.title}
          onClose={() => setActiveModalEvent(null)}
        />
      )}
    </div>
  );
}
