import React, { useState, useRef, useEffect } from 'react';
import { register, verifyOTP } from '../api';
import Captcha from './Captcha';
import type { CaptchaHandle } from './Captcha';

interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const captchaRef = useRef<CaptchaHandle>(null);

  useEffect(() => {
    if (!codeSent || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => Math.max(t - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [codeSent, timeLeft]);

  const sendOtp = async () => {
    await register({ phone, password, full_name: fullName });
    setCodeSent(true);
    setTimeLeft(300);
    setOtp('');
    setMessage('קוד אימות נשלח לוואטסאפ שלך.');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!isCaptchaValid) {
      setError('קוד אימות שגוי');
      captchaRef.current?.refresh();
      return;
    }
    setSubmitting(true);
    try {
      await sendOtp();
    } catch (err: any) {
      setError(err.message || 'שגיאה בהרשמה.');
      captchaRef.current?.refresh();
      setIsCaptchaValid(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await verifyOTP(phone, otp);
      setMessage('החשבון אומת בהצלחה! מעביר להתחברות...');
      setTimeout(onRegisterSuccess, 1500);
    } catch (err: any) {
      setError(err.message || 'קוד אימות לא תקין.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    try {
      await sendOtp();
      setMessage('קוד אימות חדש נשלח לוואטסאפ שלך.');
    } catch (err: any) {
      setError(err.message || 'שגיאה בשליחת הקוד.');
    }
  };

  const fieldStyle = { width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' };

  return (
    <div className="register-page container">
      <div className="auth-card" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>הרשמה למערכת</h2>
        {error && <p style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
        {message && <p style={{ color: '#10b981', marginBottom: '1rem', textAlign: 'center' }}>{message}</p>}

        <form onSubmit={codeSent ? handleVerify : handleRegister}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>שם מלא</label>
            <input
              type="text"
              placeholder="ישראל ישראלי"
              style={fieldStyle}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={codeSent}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>מספר טלפון (וואטסאפ)</label>
            <input
              type="tel"
              placeholder="05X-XXXXXXX"
              style={fieldStyle}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={codeSent}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>סיסמה</label>
            <input
              type="password"
              placeholder="******"
              style={fieldStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={codeSent}
              required
            />
          </div>

          {!codeSent && <Captcha ref={captchaRef} onVerify={setIsCaptchaValid} />}

          {codeSent && (
            <div className="form-group" style={{ marginTop: '1.5rem', marginBottom: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                קוד אימות וואטסאפ
              </label>
              <input
                type="text"
                maxLength={4}
                inputMode="numeric"
                placeholder="- - - -"
                style={{ width: '100%', padding: '1rem', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
              />
              <p style={{ marginTop: '0.5rem', textAlign: 'center', color: timeLeft > 0 && timeLeft < 60 ? '#ef4444' : '#6b7280', fontSize: '0.9rem' }}>
                {timeLeft > 0
                  ? <>הקוד יפוג בעוד: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</>
                  : 'הקוד פג תוקף — לחץ "שלח קוד מחדש".'}
              </p>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}
            disabled={submitting || (codeSent && otp.length < 4)}
          >
            {codeSent
              ? (submitting ? 'מאמת...' : 'אמת קוד והשלם הרשמה')
              : (submitting ? 'שולח...' : 'הרשם והמשך לאימות')}
          </button>

          {codeSent && (
            <button
              type="button"
              onClick={handleResend}
              className="btn-secondary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            >
              שלח קוד מחדש
            </button>
          )}
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          כבר יש לך חשבון? <a href="#" onClick={onSwitchToLogin} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>התחבר כאן</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
