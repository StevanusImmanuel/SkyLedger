'use client';
import React, { useState, useEffect, useMemo } from 'react';

interface TextTypeProps {
  text: string | string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
  showCursor?: boolean;
  cursorCharacter?: string;
  loop?: boolean;
  startOnVisible?: boolean;
}

export default function TextType({
  text,
  typingSpeed = 50,
  deletingSpeed = 30,
  pauseDuration = 2000,
  className = '',
  showCursor = true,
  cursorCharacter = '|',
  loop = false,
  startOnVisible = true,
}: TextTypeProps) {
  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const containerRef = React.useRef<HTMLSpanElement>(null);

  // Intersection Observer to start animation only when visible
  useEffect(() => {
    if (!startOnVisible) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const currentFullText = textArray[index % textArray.length];
    
    const handleTyping = () => {
      if (!isDeleting) {
        if (displayedText.length < currentFullText.length) {
          setDisplayedText(currentFullText.slice(0, displayedText.length + 1));
        } else if (loop) {
          setTimeout(() => setIsDeleting(true), pauseDuration);
        }
      } else {
        if (displayedText.length > 0) {
          setDisplayedText(currentFullText.slice(0, displayedText.length - 1));
        } else {
          setIsDeleting(false);
          setIndex((prev) => prev + 1);
        }
      }
    };

    const timeout = setTimeout(
      handleTyping,
      isDeleting ? deletingSpeed : typingSpeed
    );

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, index, textArray, typingSpeed, deletingSpeed, pauseDuration, loop, isVisible]);

  return (
    <span ref={containerRef} className={`${className} font-mono`}>
      {displayedText}
      {showCursor && (
        <span className="animate-pulse ml-1 font-bold">{cursorCharacter}</span>
      )}
    </span>
  );
}