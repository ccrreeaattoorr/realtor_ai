import React, { useState, useRef, useEffect } from 'react';
import { register, verifyOTP } from '../api';
import Captcha from './Captcha';
import type { CaptchaHandle } from './Captcha';

interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [step, setStep] = useState(1); // 1: Registration, 2: Verification
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);
  const captchaRef = useRef<CaptchaHandle>(null);

  useEffect(() => {
    let timer: any;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCaptchaValid) {
      setError('קוד אימות שגוי');
      captchaRef.current?.refresh();
      return;
    }

    try {
      await register({ phone, password, full_name: fullName });
      setStep(2);
      setTimeLeft(300);
      setError('');
      setMessage('קוד אימות נשלח לוואטסאפ שלך.');
    } catch (err: any) {
      setError(err.message || 'שגיאה בהרשמה.');
      captchaRef.current?.refresh();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyOTP(phone, otp);
      setMessage('החשבון אומת בהצלחה! מעביר להתחברות...');
      setTimeout(onRegisterSuccess, 2000);
    } catch (err: any) {
      setError(err.message || 'קוד אימות לא תקין.');
    }
  };

  if (step === 2) {
    return (
      <div className="register-page container">
        <div className="auth-card" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>אימות מספר טלפון</h2>
          {error && <p style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
          {message && <p style={{ color: '#10b981', marginBottom: '1rem', textAlign: 'center' }}>{message}</p>}
          <form onSubmit={handleVerify}>
            <p style={{ marginBottom: '1rem', textAlign: 'center' }}>הזן את 4 הספרות שנשלחו ל- {phone}</p>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <input 
                type="text" 
                maxLength={4}
                placeholder="- - - -" 
                style={{ width: '100%', padding: '1rem', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <p style={{ textAlign: 'center', marginBottom: '1rem', color: timeLeft < 60 ? '#ef4444' : 'inherit' }}>
              הקוד יפוג בעוד: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </p>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem' }}>אמת קוד</button>
            <button type="button" onClick={() => setStep(1)} className="btn-secondary" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}>חזור</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page container">
      <div className="auth-card" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>הרשמה למערכת</h2>
        {error && <p style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleRegister}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>שם מלא</label>
            <input 
              type="text" 
              placeholder="ישראל ישראלי" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>מספר טלפון (וואטסאפ)</label>
            <input 
              type="tel" 
              placeholder="05X-XXXXXXX" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>סיסמה</label>
            <input 
              type="password" 
              placeholder="******" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Captcha ref={captchaRef} onVerify={setIsCaptchaValid} />

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}
          >
            הרשם והמשך לאימות
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          כבר יש לך חשבון? <a href="#" onClick={onSwitchToLogin} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>התחבר כאן</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
