import { useState, useEffect, useCallback } from 'react';
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaVoteYea,
  FaPalette,
  FaLock,
  FaChevronLeft,
  FaChevronRight,
  FaImages,
} from 'react-icons/fa';
import { api } from '../services/api';
import type { KeloEvent, Poll, CompetitionStatus } from '../types';
import PaintingApplicationModal from '../components/PaintingApplicationModal';
import './EventsPage.css';

export default function EventsPage() {
  const [events, setEvents] = useState<KeloEvent[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [compStatuses, setCompStatuses] = useState<Record<string, CompetitionStatus>>({});
  const [activeImageIndexes, setActiveImageIndexes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [activeModalEvent, setActiveModalEvent] = useState<{ id: string; title: string } | null>(null);

  const loadEventData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedEvents, fetchedPolls] = await Promise.all([
        api.getEvents(),
        api.getPolls(),
      ]);
      setEvents(fetchedEvents);
      setPolls(fetchedPolls);

      // Load status for any painting competition events
      const paintEvents = fetchedEvents.filter((e) => e.eventType === 'painting_competition');
      const statusMap: Record<string, CompetitionStatus> = {};
      await Promise.all(
        paintEvents.map(async (pe) => {
          try {
            const st = await api.getCompetitionStatus(pe.id);
            statusMap[pe.id] = st;
          } catch (e) {
            console.error('[Competition status fetch error]', e);
          }
        })
      );
      setCompStatuses(statusMap);
    } catch (err) {
      console.error('[EventsPage] Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  const handleNextImage = (eventId: string, total: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndexes((prev) => ({
      ...prev,
      [eventId]: ((prev[eventId] || 0) + 1) % total,
    }));
  };

  const handlePrevImage = (eventId: string, total: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndexes((prev) => ({
      ...prev,
      [eventId]: ((prev[eventId] || 0) - 1 + total) % total,
    }));
  };

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
          Painting Competitions (First 50)
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
              const linkedPoll = polls.find((p) => p.eventId === evt.id)
                || (evt.eventType === 'poll' ? polls[0] : null);

              // Multi-image list for event
              const eventImages: string[] = evt.images && evt.images.length > 0
                ? evt.images
                : (evt.bannerUrl ? [evt.bannerUrl] : []);
              const currentImgIdx = activeImageIndexes[evt.id] || 0;
              const currentImg = eventImages[currentImgIdx] || evt.bannerUrl;

              // Painting competition quota
              const compStatus = compStatuses[evt.id];
              const registeredCount = compStatus?.count ?? 0;
              const isQuotaFull = compStatus?.isFull ?? (registeredCount >= 50);

              return (
                <article key={evt.id} className={`event-card ${evt.eventType}`}>
                  {currentImg && (
                    <div className="event-banner-wrap" style={{ position: 'relative' }}>
                      <img src={currentImg} alt={evt.title} className="event-banner-img" />

                      <span className={`event-type-tag ${evt.eventType}`}>
                        {evt.eventType === 'painting_competition' && '🎨 Painting Contest'}
                        {evt.eventType === 'poll' && '📊 Polling Contest'}
                        {evt.eventType === 'hall_day' && '🏛️ Hall Day Special'}
                        {evt.eventType === 'general' && '✨ Special Event'}
                      </span>

                      {/* Multi-image gallery controls if multiple images are provided */}
                      {eventImages.length > 1 && (
                        <>
                          <div
                            className="event-images-indicator"
                            style={{
                              position: 'absolute',
                              bottom: '0.6rem',
                              right: '0.6rem',
                              backgroundColor: 'rgba(15, 23, 42, 0.75)',
                              backdropFilter: 'blur(4px)',
                              color: '#ffffff',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              zIndex: 3,
                            }}
                          >
                            <FaImages /> {currentImgIdx + 1} / {eventImages.length}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handlePrevImage(evt.id, eventImages.length, e)}
                            aria-label="Previous image"
                            style={{
                              position: 'absolute',
                              left: '0.5rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              backgroundColor: 'rgba(15, 23, 42, 0.6)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '28px',
                              height: '28px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 3,
                            }}
                          >
                            <FaChevronLeft size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleNextImage(evt.id, eventImages.length, e)}
                            aria-label="Next image"
                            style={{
                              position: 'absolute',
                              right: '0.5rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              backgroundColor: 'rgba(15, 23, 42, 0.6)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '28px',
                              height: '28px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 3,
                            }}
                          >
                            <FaChevronRight size={12} />
                          </button>

                          {/* Thumbnail dots */}
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '0.6rem',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              display: 'flex',
                              gap: '4px',
                              zIndex: 3,
                            }}
                          >
                            {eventImages.map((_, dotIdx) => (
                              <button
                                key={dotIdx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveImageIndexes((p) => ({ ...p, [evt.id]: dotIdx }));
                                }}
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  border: 'none',
                                  backgroundColor: dotIdx === currentImgIdx ? '#d97706' : 'rgba(255, 255, 255, 0.7)',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              />
                            ))}
                          </div>
                        </>
                      )}
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

                    {/* ─── Painting Competition Card Action & Quota ─── */}
                    {evt.eventType === 'painting_competition' && (
                      <div className="event-action-box painting-box" style={{ marginBottom: '1rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e' }}>
                            Registrations Cap: First 50 Only
                          </span>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '9999px',
                              backgroundColor: isQuotaFull ? '#fee2e2' : '#dcfce7',
                              color: isQuotaFull ? '#991b1b' : '#166534',
                            }}
                          >
                            {isQuotaFull ? 'FULL (50/50)' : `${registeredCount}/50 Registered`}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, Math.round((registeredCount / 50) * 100))}%`,
                              backgroundColor: isQuotaFull ? '#dc2626' : '#d97706',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>

                        <p className="action-hint">
                          {isQuotaFull
                            ? 'The first 50 application spots are fully booked! The administrative polling contest is active below.'
                            : 'Open to all students. Registrations strictly close once the first 50 participants apply!'}
                        </p>

                        <button
                          className="btn-apply-painting"
                          disabled={isQuotaFull}
                          style={isQuotaFull ? { opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#94a3b8' } : {}}
                          onClick={() => setActiveModalEvent({ id: evt.id, title: evt.title })}
                        >
                          <FaPalette /> {isQuotaFull ? 'Registrations Full (50/50)' : 'Apply to Participate'}
                        </button>
                      </div>
                    )}

                    {/* ─── Polling Contest Card (For Poll Events & Painting Participant Polls) ─── */}
                    {linkedPoll && (
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
                          {linkedPoll.options.length === 0 ? (
                            <p style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic', padding: '0.5rem 0' }}>
                              No registered candidates in this polling contest yet. Registered applicants will appear here automatically.
                            </p>
                          ) : (
                            linkedPoll.options.map((opt) => {
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
                            })
                          )}
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
          onSuccess={loadEventData}
        />
      )}
    </div>
  );
}
