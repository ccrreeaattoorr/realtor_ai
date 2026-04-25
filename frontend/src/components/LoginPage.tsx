import React, { useState, useRef } from 'react';
import { login } from '../api';
import Captcha from './Captcha';
import type { CaptchaHandle } from './Captcha';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
  onSwitchToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [error, setError] = useState('');
  const captchaRef = useRef<CaptchaHandle>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCaptchaValid) {
      setError('קוד אימות שגוי');
      captchaRef.current?.refresh();
      return;
    }

    const formData = new FormData();
    formData.append('phone', phone);
    formData.append('password', password);

    try {
      const res = await login(formData);
      onLoginSuccess(res.access_token);
    } catch (err: any) {
      if (err.message.includes('403')) {
        setError('חשבון זה טרם אומת. אנא הרשם מחדש או בצע אימות.');
      } else if (err.message.includes('401')) {
        setError('פרטי התחברות שגויים (טלפון או סיסמה)');
      } else {
        setError('שגיאת תקשורת עם השרת');
      }
      captchaRef.current?.refresh();
    }
  };

  return (
    <div className="login-page container">
      <div className="auth-card" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>כניסה למערכת</h2>
        {error && <p style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>מספר טלפון</label>
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
            התחבר
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
        אין לך חשבון? <a href="#" onClick={onSwitchToRegister} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>הרשם כאן</a>
        </p>      </div>
    </div>
  );
};

export default LoginPage;
