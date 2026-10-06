import { useState } from 'react';
import { FaTimes, FaPalette, FaCheckCircle } from 'react-icons/fa';
import { api } from '../services/api';
import './PaintingApplicationModal.css';

interface PaintingApplicationModalProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

export default function PaintingApplicationModal({
  eventId,
  eventTitle,
  onClose,
}: PaintingApplicationModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [hall, setHall] = useState('');
  const [paintingCategory, setPaintingCategory] = useState('Watercolors on Canvas');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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
        paintingCategory,
        description: description.trim() || 'Creative artwork submission',
      });
      setSubmitted(true);
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

            <div className="form-field">
              <label>
                Painting Category <span className="req">*</span>
              </label>
              <select
                value={paintingCategory}
                onChange={(e) => setPaintingCategory(e.target.value)}
                className="paint-select"
              >
                <option value="Watercolors on Canvas">Watercolors on Canvas</option>
                <option value="Acrylic & Mixed Media">Acrylic & Mixed Media</option>
                <option value="Oil Painting">Oil Painting</option>
                <option value="Charcoal / Pencil Sketching">Charcoal / Pencil Sketching</option>
                <option value="Campus Culture & Hall Day Theme">Campus Culture & Hall Day Theme</option>
              </select>
            </div>

            <div className="form-field">
              <label>
                Concept / Artwork Description <span className="req">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Briefly describe your planned concept, theme, or artistic interpretation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="paint-form-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-submit">
                {submitting ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
