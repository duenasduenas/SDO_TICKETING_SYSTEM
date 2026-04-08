import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSchool, faCirclePlus } from '@fortawesome/free-solid-svg-icons';

const INITIAL_FORM = {
  username:   '',
  password:   'password123',
  district:   '',
  schoolCode: '',
  school:     '',
  address:    '',
  principal:  '',
  number:     '',
  email:      '',
};

const AddSchool = () => {
  const [formData,     setFormData]     = useState(INITIAL_FORM);
  const [errors,       setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    ['username', 'district', 'schoolCode', 'school', 'address', 'principal', 'number', 'email']
      .forEach(f => { if (!formData[f]) newErrors[f] = 'This field is required'; });
    if (formData.district && !/^\d+$/.test(formData.district))
      newErrors.district = 'District must be a number';
    if (formData.number && !/^\d{10,11}$/.test(formData.number))
      newErrors.number = 'Must be 10–11 digits';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'Invalid email format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'district' && value !== '' && !/^\d+$/.test(value)) return;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/reset/addschools`,
        { ...formData, role: 'Staff' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({ title: 'Success!', text: 'School added successfully', icon: 'success', timer: 2000, showConfirmButton: false });
      setFormData(INITIAL_FORM);
      setErrors({});
    } catch (err) {
      Swal.fire({ title: 'Error!', text: err.response?.data?.message || 'Failed to add school', icon: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Reusable sub-components ── */
  const Field = ({ id, label, error, full, children }) => (
    <div style={{ gridColumn: full ? '1 / -1' : undefined, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label htmlFor={id} style={{
        fontSize: '0.72rem', fontWeight: 600, color: '#7a8fa6',
        textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: '0.75rem', color: '#dc3545' }}>{error}</span>}
    </div>
  );

  const inp = (hasError) => ({
    width: '100%', boxSizing: 'border-box',
    height: 38, border: `1.5px solid ${hasError ? '#dc3545' : '#d0dbe8'}`,
    borderRadius: 7, padding: '0 12px',
    fontSize: '0.83rem', color: '#2c3e50', background: '#fff',
    outline: 'none', fontFamily: "'Segoe UI', system-ui, sans-serif",
    transition: 'border-color .15s, box-shadow .15s',
  });

  return (
    <>
      <style>{`
        .as-inp:focus, .as-ta:focus {
          border-color: #294a70 !important;
          box-shadow: 0 0 0 3px rgba(41,74,112,0.08);
        }
        .as-btn:hover:not(:disabled) {
          background: #243f60 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(26,46,74,0.2);
        }
        .as-spin {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: asSpin .7s linear infinite;
          vertical-align: middle;
        }
        @keyframes asSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 720, margin: '0 auto' }}>

        {/* Page header */}
        <h5 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a2e4a', margin: '0 0 4px' }}>
          Add New School
        </h5>
        <p style={{ fontSize: '0.82rem', color: '#7a8fa6', margin: '0 0 20px' }}>
          Fill in the details below to register a new school account.
        </p>

        {/* Card */}
        <div style={{ background: '#fff', border: '1px solid #e4ecf4', borderRadius: 10, overflow: 'hidden' }}>

          {/* Card header */}
          <div style={{
            background: '#1a2e4a', padding: '13px 20px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <FontAwesomeIcon icon={faSchool} style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }} />
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>School Information</span>
          </div>

          {/* Form body */}
          <form onSubmit={handleSubmit} noValidate style={{ padding: '24px 24px 28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 20px' }}>

              <Field id="username" label="Username" error={errors.username}>
                <input className="as-inp" id="username" name="username" type="text"
                  value={formData.username} onChange={handleChange}
                  style={inp(errors.username)} placeholder="e.g. school_username" />
              </Field>

              <Field id="district" label="District Number" error={errors.district}>
                <input className="as-inp" id="district" name="district" type="text"
                  inputMode="numeric" pattern="[0-9]*"
                  value={formData.district} onChange={handleChange}
                  style={inp(errors.district)} placeholder="e.g. 1" />
              </Field>

              <Field id="schoolCode" label="School Code" error={errors.schoolCode}>
                <input className="as-inp" id="schoolCode" name="schoolCode" type="text"
                  value={formData.schoolCode} onChange={handleChange}
                  style={inp(errors.schoolCode)} placeholder="e.g. 123456" />
              </Field>

              <Field id="principal" label="Principal" error={errors.principal}>
                <input className="as-inp" id="principal" name="principal" type="text"
                  value={formData.principal} onChange={handleChange}
                  style={inp(errors.principal)} placeholder="Full name" />
              </Field>

              <Field id="school" label="School Name" error={errors.school} full>
                <input className="as-inp" id="school" name="school" type="text"
                  value={formData.school} onChange={handleChange}
                  style={inp(errors.school)} placeholder="Complete school name" />
              </Field>

              <Field id="address" label="Address" error={errors.address} full>
                <textarea className="as-ta" id="address" name="address"
                  value={formData.address} onChange={handleChange} rows={3}
                  style={{
                    ...inp(errors.address), height: 'auto', minHeight: 80,
                    padding: '8px 12px', resize: 'vertical',
                  }}
                  placeholder="Complete school address" />
              </Field>

              <Field id="number" label="Contact Number" error={errors.number}>
                <input className="as-inp" id="number" name="number" type="tel"
                  value={formData.number} onChange={handleChange}
                  style={inp(errors.number)} placeholder="10–11 digit number" />
              </Field>

              <Field id="email" label="Email" error={errors.email}>
                <input className="as-inp" id="email" name="email" type="email"
                  value={formData.email} onChange={handleChange}
                  style={inp(errors.email)} placeholder="school@example.com" />
              </Field>

            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #f0f4f9', margin: '24px 0 20px' }} />

            {/* Submit */}
            <button
              type="submit"
              className="as-btn"
              disabled={isSubmitting}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', height: 42, background: '#1a2e4a', color: '#fff',
                border: 'none', borderRadius: 8,
                fontSize: '0.88rem', fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                transition: 'background .2s, transform .15s, box-shadow .2s',
                fontFamily: "'Segoe UI', system-ui, sans-serif",
              }}
            >
              {isSubmitting ? (
                <><span className="as-spin" style={{ marginRight: 6 }} />Adding School…</>
              ) : (
                <><FontAwesomeIcon icon={faCirclePlus} style={{ fontSize: 13 }} />Add School</>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddSchool;