'use client';
import React, { useState, useEffect } from 'react';

const Captcha = ({ onVerify }: { onVerify: (isValid: boolean) => void }) => {
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');

  const generateCode = () => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCode(random);
    setInput('');
    onVerify(false);
  };

  useEffect(() => {
    generateCode();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setInput(val);
    onVerify(val === code);
  };

  return (
    <div className="captcha-container mt-5">
      <label className="label-text">Human Verification</label>
      <div className="flex items-center gap-2">
        {/* Code Display */}
        <div className="captcha-code-box">
          {code}
        </div>

        {/* Captcha Input */}
        <div className="captcha-input-wrapper">
          <input
            type="text"
            placeholder="Type Code"
            value={input}
            onChange={handleChange}
            autoComplete="off"
            className="captcha-field"
          />
        </div>

        {/* Refresh Button - Updated to #60a5fa */}
        <button 
          type="button" 
          onClick={generateCode} 
          className="refresh-trigger"
          title="Refresh Code"
          style={{ color: '#60a5fa' }} // Applied direct color here
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" // Uses the text color from parent
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Captcha;