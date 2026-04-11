'use client';
import React from 'react';
import styled from 'styled-components';

interface PricingProps {
  title: string;
  tag: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
}

const PricingCard = ({ 
  title, tag, price, period, description, features, buttonText, isPopular 
}: PricingProps) => {
  return (
    <StyledWrapper $isPopular={isPopular}>
      <div className="card">
        <div className="card-title-area">
          <span>{title}</span>
          <span className="card-tag">{tag}</span>
        </div>

        <div className="card-body">
          <div className="card-description">{description}</div>
          <div className="feature-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                </div>
                <span className="feature-text">{f}</span>
              </div>
            ))}
          </div>

          <div className="card-actions">
            <div className="price-container">
              <div className="price">
                {price !== "Contact" && <span className="price-currency">$</span>}
                {price}
              </div>
              <span className="price-period">{period}</span>
            </div>
            <button className="animated-button">{buttonText}</button>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div<{ $isPopular?: boolean }>`
  .card {
    --primary: ${props => props.$isPopular ? '#1a2d5a' : '#f8fafc'};
    --primary-text: ${props => props.$isPopular ? '#ffffff' : '#1a2d5a'};
    --text: #1a2d5a;
    
    position: relative;
    width: 22em;
    background: #ffffff;
    border: 0.3em solid var(--text);
    border-radius: 0.8em;
    box-shadow: 0.6em 0.6em 0 var(--text);
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .card:hover {
    transform: translate(-0.2em, -0.2em);
    box-shadow: 0.8em 0.8em 0 var(--text);
  }

  .card-title-area {
    padding: 1.5em;
    background: var(--primary);
    color: var(--primary-text);
    font-weight: 900;
    font-size: 1.2em;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 0.3em solid var(--text);
    text-transform: uppercase;
  }

  .card-tag {
    background: #60a5fa; 
    color: #ffffff; /* Forced white for visibility */
    font-size: 0.55em;
    font-weight: 900;
    padding: 0.5em 0.8em;
    border: 0.15em solid var(--text);
    border-radius: 0.4em;
    transform: rotate(3deg);
    box-shadow: 0.15em 0.15em 0 var(--text);
    white-space: nowrap;
  }

  .card-body { 
    padding: 2em 1.5em;
    flex-grow: 1;
  }

  .card-description { 
    font-size: 0.95em; 
    margin-bottom: 2em; 
    font-weight: 600; 
    color: #64748b; 
    line-height: 1.5;
  }

  .feature-grid { display: grid; gap: 1em; margin-bottom: 2.5em; }

  .feature-item { 
    display: flex; 
    align-items: center; 
    gap: 0.8em; 
    font-size: 0.9em; 
    font-weight: 800; 
    color: var(--text); 
  }

  .feature-icon { 
    min-width: 1.4em; 
    height: 1.4em; 
    background: #60a5fa; 
    border: 0.12em solid var(--text); 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    border-radius: 0.3em; 
  }

  .feature-icon svg { width: 0.9em; fill: white; stroke: white; stroke-width: 1; }

  .card-actions { 
    display: flex; 
    justify-content: space-between; 
    align-items: flex-end; 
    border-top: 0.2em dashed #cbd5e1; 
    padding-top: 1.5em;
    gap: 0.5em;
  }

  .price { font-size: 2em; font-weight: 900; color: var(--text); line-height: 1; }
  .price-currency { font-size: 0.5em; vertical-align: top; margin-right: 0.1em; }
  .price-period { font-size: 0.8em; color: #64748b; font-weight: 700; display: block; margin-top: 0.2em; }

  /* ANIMATED BUTTON */
  .animated-button {
    background: ${props => props.$isPopular ? '#60a5fa' : '#1a2d5a'};
    color: white;
    font-weight: 900;
    padding: 0.8em 1.4em;
    border: 0.2em solid var(--text);
    border-radius: 0.5em;
    box-shadow: 0.3em 0.3em 0 var(--text);
    cursor: pointer;
    text-transform: uppercase;
    font-size: 0.8em;
    transition: all 0.1s ease;
    white-space: nowrap;
  }

  .animated-button:hover {
    transform: translate(-0.1em, -0.1em);
    box-shadow: 0.4em 0.4em 0 var(--text);
    background: #60a5fa;
  }

  .animated-button:active {
    transform: translate(0.2em, 0.2em);
    box-shadow: 0.1em 0.1em 0 var(--text);
  }
`;

export default PricingCard;