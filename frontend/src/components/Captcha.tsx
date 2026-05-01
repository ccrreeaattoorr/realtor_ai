import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import './Captcha.css';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
}

export interface CaptchaHandle {
  refresh: () => void;
  getValue: () => string;
}

const Captcha = forwardRef<CaptchaHandle, CaptchaProps>(({ onVerify }, ref) => {
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [timeLeft, setLeft] = useState(300);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
    setInput('');
    setLeft(300);
  };

  useImperativeHandle(ref, () => ({
    refresh: generateCode,
    getValue: () => input
  }));

  useEffect(() => {
    generateCode();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      generateCode();
      return;
    }
    const timer = setInterval(() => setLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (!code || !input) {
      onVerify(false);
      return;
    }
    onVerify(input.toUpperCase() === code);
  }, [input, code]);

  return (
    <div className="captcha-container">
      <div className="captcha-display">
        <span className="captcha-code">{code}</span>
        <button type="button" onClick={generateCode} className="refresh-btn">🔄</button>
      </div>
      <div className="captcha-input-group">
        <input 
          type="text" 
          placeholder="הזן קוד אימות" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
        />
        <span className="timer">מרענן בעוד: {timeLeft} שנ'</span>
      </div>
    </div>
  );
});

export default Captcha;
