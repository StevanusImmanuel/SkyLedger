import styled from 'styled-components';

export const StyledWrapper = styled.div`
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

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
    animation: fadeInDown 0.6s ease-out forwards;
  }

  /* Navigation Buttons */
  .back-btn {
    position: absolute;
    top: 20px;
    left: 20px;
    font-size: 10px;
    font-weight: 900;
    color: #1a2d5a;
    background: transparent;
    border: 2px solid #1a2d5a;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    animation: fadeInDown 0.6s ease-out 0.1s forwards;
    opacity: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
  }

  .back-btn:hover {
    background: #1a2d5a;
    color: white;
    transform: translateX(-2px);
  }

  .back-btn:active {
    transform: translateX(-2px) scale(0.98);
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
    animation: slideInUp 0.5s ease-out forwards;
    opacity: 0;
  }

  /* Title Section Animation */
  .title-section {
    animation: fadeInDown 0.6s ease-out 0.15s forwards;
    opacity: 0;
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
    position: relative;
    animation: slideInUp 0.5s ease-out forwards;
    opacity: 0;
  }

  .input-form:focus-within {
    border-color: #1a2d5a;
    background-color: #ffffff;
    box-shadow: 0 0 0 4px rgba(26, 45, 90, 0.05);
  }

  /* Stagger animations for form fields */
  & > form > div:nth-child(2) {
    animation: fadeInDown 0.6s ease-out 0.2s forwards;
    opacity: 0;
  }

  & > form > div:nth-child(3) {
    animation: slideInUp 0.5s ease-out 0.3s forwards;
    opacity: 0;
  }

  & > form > div:nth-child(4) {
    animation: slideInUp 0.5s ease-out 0.4s forwards;
    opacity: 0;
  }

  & > form > div:nth-child(5) {
    animation: slideInUp 0.5s ease-out 0.5s forwards;
    opacity: 0;
  }

  & > form > div:nth-child(6) {
    animation: slideInUp 0.5s ease-out 0.6s forwards;
    opacity: 0;
  }

  & > form > div:nth-child(7) {
    animation: slideInUp 0.5s ease-out 0.7s forwards;
    opacity: 0;
  }

  & > form > div:nth-child(n + 8) {
    animation: slideInUp 0.5s ease-out 0.8s forwards;
    opacity: 0;
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
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    animation: slideInUp 0.5s ease-out 0.85s forwards;
    opacity: 0;
  }

  .btn-primary:not(:disabled):hover {
    background-color: #0f1c3a;
    transform: translateY(-3px);
    box-shadow: 0 12px 20px -5px rgba(26, 45, 90, 0.3);
  }

  .btn-primary:not(:disabled):active {
    transform: translateY(-1px);
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
    animation: slideInUp 0.5s ease-out 0.55s forwards;
    opacity: 0;
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
    transition: 0.2s ease;
  }

  .captcha-code-box:hover {
    border-color: #1a2d5a;
    background-color: #f8fafc;
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
    animation: slideInUp 0.5s ease-out 0.9s forwards;
    opacity: 0;
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
    transition: all 0.2s ease;
    text-transform: uppercase;
  }

  .external-btn:hover {
    border-color: #1a2d5a;
    color: #1a2d5a;
    background-color: #f8fafc;
    transform: translateY(-2px);
  }

  .external-btn:active {
    transform: translateY(0);
  }

  /* Autofill Overrides */
  .input-field:-webkit-autofill {
    -webkit-text-fill-color: #1a2d5a !important;
    transition: background-color 5000s ease-in-out 0s;
  }
`;