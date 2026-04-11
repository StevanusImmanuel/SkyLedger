'use client';
import styled from 'styled-components';

export const SectionWrapper = styled.section`
  padding: 80px 0;
  background-color: #F8FAFC;

  .parent {
    width: 100%;
    max-width: 340px;
    perspective: 1000px;
  }

  .card {
    padding-top: 50px;
    border: 3px solid white;
    transform-style: preserve-3d;
    background: linear-gradient(135deg,#0000 18.75%,#f1f5f9 0 31.25%,#0000 0),
                repeating-linear-gradient(45deg,#f1f5f9 -6.25% 6.25%,#ffffff 0 18.75%);
    background-size: 60px 60px;
    background-color: #f8fafc;
    width: 100%;
    box-shadow: rgba(26, 45, 90, 0.1) 0px 30px 30px -10px;
    transition: all 0.5s ease-in-out;
  }

  .card:hover {
    background-position: -100px 100px, -100px 100px;
    transform: rotate3d(0.5, 1, 0, 20deg);
  }

  .content-box {
    background: rgba(26, 45, 90, 0.95);
    backdrop-filter: blur(5px);
    transition: all 0.5s ease-in-out;
    padding: 60px 25px 25px 25px;
    transform-style: preserve-3d;
  }

  .content-box .card-title {
    display: inline-block;
    color: white;
    font-size: 22px;
    font-weight: 900;
    line-height: 1.2;
    transform: translate3d(0px, 0px, 50px);
  }

  .content-box .card-content {
    margin-top: 15px;
    font-size: 13px;
    font-weight: 500;
    color: #cbd5e1;
    transform: translate3d(0px, 0px, 30px);
  }

  .content-box .see-more {
    margin-top: 1.5rem;
    display: inline-block;
    font-weight: 900;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #1a2d5a;
    background: #60a5fa;
    padding: 0.6rem 1rem;
    transform: translate3d(0px, 0px, 20px);
  }

  .date-box {
    position: absolute;
    top: 30px;
    right: 30px;
    height: 60px;
    width: 60px;
    background: white;
    border: 2px solid #1a2d5a;
    padding: 10px;
    transform: translate3d(0px, 0px, 80px);
  }

  .date-box span { display: block; text-align: center; }
  .date-box .month { color: #60a5fa; font-size: 9px; font-weight: 900; }
  .date-box .date { font-size: 20px; font-weight: 900; color: #1a2d5a; }
`;