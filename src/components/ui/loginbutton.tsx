'use client';
import React from 'react';
import styled from 'styled-components';

const LoginButton = () => {
  return (
    <StyledWrapper>
      <button className="button type1">
        <span className="btn-txt">Login</span>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .button {
    height: 45px;
    width: 140px;
    position: relative;
    background-color: transparent;
    cursor: pointer;
    border: 2px solid #1a2d5a;
    overflow: hidden;
    border-radius: 4px; /* Matching your previous rectangular style */
    color: #1a2d5a;
    transition: all 0.5s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-txt {
    z-index: 1;
    font-weight: 900;
    letter-spacing: 2px;
    text-transform: uppercase;
    font-size: 11px;
  }

  .type1::after {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    transition: all 0.5s ease-in-out;
    background-color: #1a2d5a;
    visibility: hidden;
    height: 10px;
    width: 10px;
    z-index: -1;
  }

  .button:hover {
    box-shadow: 1px 1px 50px rgba(26, 45, 90, 0.3);
    color: #fff;
    border: 2px solid #1a2d5a;
  }

  .type1:hover::after {
    visibility: visible;
    transform: scale(35) translateX(2px); /* Scaled for 140px width */
  }
`;

export default LoginButton;