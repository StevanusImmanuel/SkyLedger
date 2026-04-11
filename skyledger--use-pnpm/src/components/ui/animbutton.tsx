'use client';
import React from 'react';
import styled from 'styled-components';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  primaryColor?: string;
  hoverColor?: string;
  showArrow?: boolean;
  isActive?: boolean;
}

const AnimatedButton = ({ 
  text, 
  primaryColor = "#ffffff", 
  hoverColor = "#60a5fa", 
  showArrow = false,
  isActive = false, 
  ...props 
}: Props) => {
  return (
    <StyledWrapper 
      $primary={primaryColor} 
      $hover={hoverColor} 
      $isActive={isActive}
    >
      <button {...props}>
        <div className="text-container">
          <span className="base-text">{text}</span>
          <span className="hover-reveal-text" aria-hidden="true">{text}</span>
        </div>
        
        {showArrow && (
          <svg xmlns="http://www.w3.org/2000/svg" className="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        )}
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div<{ 
  $primary: string; 
  $hover: string; 
  $isActive: boolean; 
}>`
  /* The wrapper ensures the button doesn't stretch to 100% width unless told to */
  width: fit-content;
  display: inline-block;

  button {
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    /* This gap controls the distance between text and arrow precisely */
    gap: 10px; 
    padding: 8px 0;
    position: relative;
    text-align: left;
    outline: none;
  }

  .text-container {
    position: relative;
    display: block;
  }

  .base-text {
    display: block;
    color: ${props => props.$primary};
    font-weight: 900;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    line-height: 1.2;
    transition: opacity 0.3s ease;
  }

  .hover-reveal-text {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    color: ${props => props.$hover};
    font-weight: 900;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    line-height: 1.2;
    /* Prevents ghosting: layers align exactly, revealed by clip-path */
    clip-path: ${props => props.$isActive ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)'};
    transition: clip-path 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
  }

  /* Underline logic */
  button::after {
    content: '';
    position: absolute;
    bottom: 0px;
    left: 0;
    height: 2px;
    background-color: ${props => props.$hover};
    width: ${props => props.$isActive ? '100%' : '0'};
    transition: width 0.3s ease-out;
  }

  button:hover .hover-reveal-text {
    clip-path: inset(0 0 0 0);
  }

  button:hover::after {
    width: 100%;
  }

  .arrow-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: ${props => props.$isActive ? props.$hover : props.$primary};
    transition: all 0.3s ease;
    transform: ${props => props.$isActive ? 'translateX(4px)' : 'translateX(0)'};
  }

  button:hover .arrow-icon {
    color: ${props => props.$hover};
    transform: translateX(4px);
  }
`;

export default AnimatedButton;