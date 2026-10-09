import { useState, useEffect } from 'react';
import { FaTimes, FaPalette, FaCheckCircle, FaUsers } from 'react-icons/fa';
import { api } from '../services/api';
import type { CompetitionStatus } from '../types';
import './PaintingApplicationModal.css';

interface PaintingApplicationModalProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PaintingApplicationModal({
  eventId,
  eventTitle,
  onClose,
  onSuccess,
}: PaintingApplicationModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [hall, setHall] = useState('');

  const [compStatus, setCompStatus] = useState<CompetitionStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        setLoadingStatus(true);
        const st = await api.getCompetitionStatus(eventId);
        setCompStatus(st);
      } catch (err) {
        console.error('[Competition status]', err);
      } finally {
        setLoadingStatus(false);
      }
    }
    fetchStatus();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (compStatus?.isFull) {
      setErrorMessage('Registration is closed. All 50 spots have already been filled.');
      return;
    }

    if (!fullName.trim() || !email.trim() || !phone.trim() || !rollNumber.trim()) {
      setErrorMessage('Please fill in all required contact and participant information.');
      return;
    }

    try {
      setSubmitting(true);
      await api.submitPaintingApplication({
        eventId,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        rollNumber: rollNumber.trim(),
        department: department.trim() || 'General Department',
        hall: hall.trim() || 'General Campus Hall',
        paintingCategory: 'Acrylic Painting',
        description: 'Acrylic Painting',
      });
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('[Application Submission]', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="paint-modal-overlay" onClick={onClose}>
      <div className="paint-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="paint-modal-header">
          <div className="paint-modal-title-wrap">
            <FaPalette className="paint-modal-icon" />
            <div>
              <h3>Apply for Painting Competition</h3>
              <p className="paint-modal-sub">{eventTitle}</p>
            </div>
          </div>
          <button className="paint-close-btn" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        {submitted ? (
          <div className="paint-success-state">
            <FaCheckCircle className="paint-success-icon" />
            <h4>Application Submitted!</h4>
            <p>
              Thank you, <strong>{fullName}</strong>. Your entry details for{' '}
              <strong>{eventTitle}</strong> have been recorded.
            </p>
            <p className="paint-success-note">
              Our event coordinators will review your registration and contact you via phone or email with your stall/easel allocation!
            </p>
            <button className="btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form className="paint-modal-form" onSubmit={handleSubmit}>
            {/* Spots capacity indicator */}
            <div
              className={`spots-capacity-badge ${compStatus?.isFull ? 'full' : 'available'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.9rem',
                marginBottom: '1rem',
                borderRadius: '8px',
                backgroundColor: compStatus?.isFull ? '#fee2e2' : '#f0fdf4',
                color: compStatus?.isFull ? '#991b1b' : '#166534',
                fontSize: '0.88rem',
                fontWeight: 500,
                border: `1px solid ${compStatus?.isFull ? '#fecaca' : '#bbf7d0'}`,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaUsers />
                {loadingStatus ? (
                  'Checking spot availability...'
                ) : compStatus?.isFull ? (
                  <span>
                    <strong>Registration Closed:</strong> All 50 participant spots have been filled.
                  </span>
                ) : (
                  <span>
                    <strong>Strict 50-Participant Limit:</strong> {compStatus?.count ?? 0}/50 spots registered ({compStatus?.spotsRemaining ?? 50} spots remaining)
                  </span>
                )}
              </span>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {compStatus?.isFull ? 'Full' : 'Open'}
              </span>
            </div>

            {errorMessage && <div className="paint-error-box">{errorMessage}</div>}

            <div className="form-row-2">
              <div className="form-field">
                <label>
                  Full Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>
                  Phone Number <span className="req">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label>
                  Email Address <span className="req">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. arjun@kgpian.iitkgp.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>
                  Roll Number / Participant ID <span className="req">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 23CS10052"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label>Department <span className="req">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mechanical Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Hall of Residence <span className="req">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Patel Hall"
                  value={hall}
                  onChange={(e) => setHall(e.target.value)}
                />
              </div>
            </div>

            <div className="paint-form-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || compStatus?.isFull}
                className="btn-submit"
                style={compStatus?.isFull ? { opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#94a3b8' } : {}}
              >
                {compStatus?.isFull
                  ? 'Registration Closed (50/50 Full)'
                  : submitting
                  ? 'Submitting Application...'
                  : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
