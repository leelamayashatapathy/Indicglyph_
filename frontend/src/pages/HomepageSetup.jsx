import { useState, useEffect } from 'react';
import ErrorBanner from '../components/ErrorBanner';
import LoadingSkeleton from '../components/LoadingSkeleton';
import '../styles/HomepageSetup.css';

function HomepageSetup() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('hero');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/homepage/content');
      if (!response.ok) {
        throw new Error('Unable to load homepage content');
      }
      const data = await response.json();
      setContent(data);
    } catch (error) {
      setError('Error loading homepage content.');
    } finally {
      setLoading(false);
    }
  };

  const saveSection = async (section, data) => {
    setSaving(true);
    setMessage('');
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please sign in again to edit the homepage.');
        setSaving(false);
        return;
      }
      const response = await fetch(`/api/homepage/${section}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const updated = await response.json();
        setContent(updated);
        setMessage(`${section.charAt(0).toUpperCase() + section.slice(1)} section updated successfully!`);
      } else {
        if (response.status === 401) {
          setError('Please sign in again to continue editing.');
        } else {
          setError('Error saving changes. Please try again.');
        }
      }
    } catch (error) {
      setError('Error: ' + error.message);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const updateHero = (field, value) => {
    setContent({
      ...content,
      hero: { ...content.hero, [field]: value }
    });
  };

  const updateTestimonial = (index, field, value) => {
    const newTestimonials = [...content.testimonials];
    newTestimonials[index] = { ...newTestimonials[index], [field]: value };
    setContent({ ...content, testimonials: newTestimonials });
  };

  const addTestimonial = () => {
    const newTestimonials = [
      ...content.testimonials,
      { name: '', quote: '', role: '', avatar_url: null }
    ];
    setContent({ ...content, testimonials: newTestimonials });
  };

  const removeTestimonial = (index) => {
    const newTestimonials = content.testimonials.filter((_, i) => i !== index);
    setContent({ ...content, testimonials: newTestimonials });
  };

  const updateSponsor = (index, field, value) => {
    const newSponsors = [...content.sponsors];
    newSponsors[index] = { ...newSponsors[index], [field]: value };
    setContent({ ...content, sponsors: newSponsors });
  };

  const addSponsor = () => {
    const newSponsors = [
      ...content.sponsors,
      { name: '', logo_url: '', website_url: 'https://' }
    ];
    setContent({ ...content, sponsors: newSponsors });
  };

  const removeSponsor = (index) => {
    const newSponsors = content.sponsors.filter((_, i) => i !== index);
    setContent({ ...content, sponsors: newSponsors });
  };

  const updateFooter = (field, value) => {
    setContent({
      ...content,
      footer: { ...content.footer, [field]: value }
    });
  };

  if (loading) {
    return (
      <div className="homepage-setup">
        <LoadingSkeleton lines={4} />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="homepage-setup">
        <ErrorBanner message={error || 'Unable to load homepage content.'} onRetry={fetchContent} />
      </div>
    );
  }

  return (
    <div className="homepage-setup">
      <h2 className="page-title">Homepage Content Manager</h2>
      <p className="page-subtitle">Customize your landing page content, testimonials, and sponsors</p>

      {error && <ErrorBanner message={error} />}
      {message && !error && (
        <div className="message success">
          {message}
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'hero' ? 'active' : ''}`}
          onClick={() => setActiveTab('hero')}
        >
          Hero Section
        </button>
        <button
          className={`tab ${activeTab === 'testimonials' ? 'active' : ''}`}
          onClick={() => setActiveTab('testimonials')}
        >
          Testimonials
        </button>
        <button
          className={`tab ${activeTab === 'sponsors' ? 'active' : ''}`}
          onClick={() => setActiveTab('sponsors')}
        >
          Sponsors
        </button>
        <button
          className={`tab ${activeTab === 'footer' ? 'active' : ''}`}
          onClick={() => setActiveTab('footer')}
        >
          Footer
        </button>
      </div>

      {activeTab === 'hero' && (
        <div className="section-content">
          <h3>Hero Section</h3>
          <div className="form-group">
            <label>Main Heading</label>
            <input
              type="text"
              value={content.hero.heading}
              onChange={(e) => updateHero('heading', e.target.value)}
              placeholder="Crowdsourcing AI & OCR Data Review..."
            />
          </div>
          <div className="form-group">
            <label>Subheading</label>
            <textarea
              value={content.hero.subheading}
              onChange={(e) => updateHero('subheading', e.target.value)}
              placeholder="Build the future of multilingual AI..."
              rows="3"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Primary CTA Label</label>
              <input
                type="text"
                value={content.hero.cta_primary_label}
                onChange={(e) => updateHero('cta_primary_label', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Primary CTA Link</label>
              <input
                type="text"
                value={content.hero.cta_primary_link}
                onChange={(e) => updateHero('cta_primary_link', e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Secondary CTA Label</label>
              <input
                type="text"
                value={content.hero.cta_secondary_label}
                onChange={(e) => updateHero('cta_secondary_label', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Secondary CTA Link</label>
              <input
                type="text"
                value={content.hero.cta_secondary_link}
                onChange={(e) => updateHero('cta_secondary_link', e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Hero Image URL (Optional)</label>
            <input
              type="text"
              value={content.hero.hero_image_url || ''}
              onChange={(e) => updateHero('hero_image_url', e.target.value)}
              placeholder="https://example.com/hero.jpg"
            />
          </div>
          <button
            className="btn-primary"
            onClick={() => saveSection('hero', content.hero)}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Hero Section'}
          </button>
        </div>
      )}

      {activeTab === 'testimonials' && (
        <div className="section-content">
          <div className="section-header">
            <h3>Testimonials</h3>
            <button className="btn-secondary" onClick={addTestimonial}>
              + Add Testimonial
            </button>
          </div>
          
          {content.testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-editor">
              <div className="editor-header">
                <h4>Testimonial {index + 1}</h4>
                <button
                  className="btn-danger-sm"
                  onClick={() => removeTestimonial(index)}
                >
                  Remove
                </button>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={testimonial.name}
                    onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                    placeholder="Priya Sharma"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={testimonial.role}
                    onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                    placeholder="Data Reviewer, Hindi"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Quote</label>
                <textarea
                  value={testimonial.quote}
                  onChange={(e) => updateTestimonial(index, 'quote', e.target.value)}
                  placeholder="Contributing to IndicGlyph has been..."
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Avatar URL (Optional)</label>
                <input
                  type="text"
                  value={testimonial.avatar_url || ''}
                  onChange={(e) => updateTestimonial(index, 'avatar_url', e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
          ))}
          
          <button
            className="btn-primary"
            onClick={() => saveSection('testimonials', content.testimonials)}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Testimonials'}
          </button>
        </div>
      )}

      {activeTab === 'sponsors' && (
        <div className="section-content">
          <div className="section-header">
            <h3>Sponsors</h3>
            <button className="btn-secondary" onClick={addSponsor}>
              + Add Sponsor
            </button>
          </div>
          
          {content.sponsors.map((sponsor, index) => (
            <div key={index} className="sponsor-editor">
              <div className="editor-header">
                <h4>Sponsor {index + 1}</h4>
                <button
                  className="btn-danger-sm"
                  onClick={() => removeSponsor(index)}
                >
                  Remove
                </button>
              </div>
              <div className="form-group">
                <label>Sponsor Name</label>
                <input
                  type="text"
                  value={sponsor.name}
                  onChange={(e) => updateSponsor(index, 'name', e.target.value)}
                  placeholder="Company Name"
                />
              </div>
              <div className="form-group">
                <label>Logo URL</label>
                <input
                  type="text"
                  value={sponsor.logo_url}
                  onChange={(e) => updateSponsor(index, 'logo_url', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="form-group">
                <label>Website URL</label>
                <input
                  type="text"
                  value={sponsor.website_url}
                  onChange={(e) => updateSponsor(index, 'website_url', e.target.value)}
                  placeholder="https://company.com"
                />
              </div>
            </div>
          ))}
          
          <button
            className="btn-primary"
            onClick={() => saveSection('sponsors', content.sponsors)}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Sponsors'}
          </button>
        </div>
      )}

      {activeTab === 'footer' && (
        <div className="section-content">
          <h3>Footer Content</h3>
          <div className="form-group">
            <label>Footer Blurb</label>
            <textarea
              value={content.footer.blurb}
              onChange={(e) => updateFooter('blurb', e.target.value)}
              placeholder="IndicGlyph Data Studio empowers reviewers..."
              rows="3"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                value={content.footer.company_name}
                onChange={(e) => updateFooter('company_name', e.target.value)}
                placeholder="Taapset Technologies Pvt Ltd"
              />
            </div>
            <div className="form-group">
              <label>Company Website</label>
              <input
                type="text"
                value={content.footer.company_url}
                onChange={(e) => updateFooter('company_url', e.target.value)}
                placeholder="https://www.taapset.com"
              />
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => saveSection('footer', content.footer)}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Footer'}
          </button>
        </div>
      )}
    </div>
  );
}

export default HomepageSetup;
