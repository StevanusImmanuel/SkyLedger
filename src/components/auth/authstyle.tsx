import styled from 'styled-components';

export const StyledWrapper = styled.div`
  /* Main Container Card */
  .auth-card {
    background-color: #ffffff;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    width: 100%;
    max-width: 480px;
    padding: 40px;
    position: relative;
  }

  /* Navigation Buttons */
  .back-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    font-size: 10px;
    font-weight: 900;
    color: #1a2d5a;
    background: transparent;
    border: 2px solid #1a2d5a;
    padding: 4px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: 0.2s;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  
  .back-btn:hover {
    background: #1a2d5a;
    color: white;
  }

  /* Typography */
  .label-text {
    color: #1a2d5a;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: block;
    margin-bottom: 6px;
  }

  /* Input Container */
  .input-form {
    background-color: #f8fafc;
    border: 1.5px solid transparent;
    border-radius: 10px;
    height: 52px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    transition: 0.2s ease-in-out;
    position: relative; /* Required for password toggle alignment */
  }

  .input-form:focus-within {
    border-color: #1a2d5a;
    background-color: #ffffff;
    box-shadow: 0 0 0 4px rgba(26, 45, 90, 0.05);
  }

  /* Auto-Generated / Read-Only Variant */
  .input-form.read-only {
    background-color: #f1f5f9;
    border: 1.5px dashed #cbd5e1;
  }

  /* Input Element */
  .input-field {
    background: transparent;
    margin-left: 12px;
    border: none;
    width: 100%;
    height: 100%;
    font-size: 14px;
    font-weight: 700;
    color: #1a2d5a !important;
    outline: none;
  }

  .input-field:read-only {
    cursor: not-allowed;
    opacity: 0.7;
  }

  /* Password Visibility Toggle */
  .password-toggle {
    background: transparent;
    border: none;
    color: #1a2d5a;
    opacity: 0.4;
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    transition: opacity 0.2s, transform 0.1s;
    outline: none;
  }

  .password-toggle:hover {
    opacity: 0.8;
  }

  .password-toggle:active {
    transform: scale(0.9);
  }

  /* Primary Action Button */
  .btn-primary {
    background-color: #1a2d5a;
    color: white;
    font-size: 13px;
    font-weight: 800;
    border-radius: 10px;
    height: 54px;
    width: 100%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .btn-primary:not(:disabled):hover {
    background-color: #0f1c3a;
    transform: translateY(-2px);
    box-shadow: 0 12px 20px -5px rgba(26, 45, 90, 0.3);
  }

  .btn-primary:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* Captcha Elements */
  .captcha-flex {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 52px;
    margin: 20px 0;
  }

  .captcha-code-box {
    background-color: #f1f5f9;
    border: 2px dashed #cbd5e1;
    border-radius: 10px;
    height: 100%;
    min-width: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Courier New', monospace;
    font-weight: 900;
    font-style: italic;
    color: #1a2d5a;
    letter-spacing: 3px;
    user-select: none;
  }

  .captcha-input-wrapper {
    flex: 1;
    height: 100%;
    background-color: #f8fafc;
    border-radius: 10px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    border: 1.5px solid transparent;
    transition: 0.2s;
  }

  .captcha-input-wrapper:focus-within {
    border-color: #1a2d5a;
    background-color: #ffffff;
  }

  .captcha-field {
    background: transparent;
    border: none;
    width: 100%;
    color: #1a2d5a !important;
    font-weight: 800;
    outline: none;
    font-size: 14px;
    text-transform: uppercase;
  }

  /* External Auth Buttons (Biometrics/SSO) */
  .external-btn-group {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }

  .external-btn {
    flex: 1;
    height: 48px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    gap: 8px;
    border: 1.5px solid #e2e8f0;
    background-color: #ffffff;
    transition: 0.2s;
    text-transform: uppercase;
  }

  .external-btn:hover {
    border-color: #1a2d5a;
    color: #1a2d5a;
    background-color: #f8fafc;
  }

  /* Autofill Overrides */
  .input-field:-webkit-autofill {
    -webkit-text-fill-color: #1a2d5a !important;
    transition: background-color 5000s ease-in-out 0s;
  }
`;