"use client"

import React, { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"

interface MenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "left" | "right"
  showChevron?: boolean
}

export function Menu({ trigger, children, align = "left", showChevron = true }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block text-left">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer inline-flex items-center"
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
        {showChevron && (
          <ChevronDown className="ml-2 -mr-1 h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
        )}
      </div>

      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-2 w-56 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-9 focus:outline-none z-50`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div className="py-1" role="none">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

interface MenuItemProps {
  children?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  icon?: React.ReactNode
  isActive?: boolean
}

export function MenuItem({ children, onClick, disabled = false, icon, isActive = false }: MenuItemProps) {
  return (
    <button
      className={`relative block w-full h-8 text-center group
        ${disabled ? "text-gray-400 cursor-not-allowed" : "text-gray-600"}
        ${isActive ? "bg-gray-50" : ""}
      `}
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="flex items-center justify-center h-full">
        {icon && (
          <span className="h-4 w-4 transition-all duration-200 group-hover:[&_svg]:stroke-[2.5]">
            {icon}
          </span>
        )}
        {children}
      </span>
    </button>
  )
}

export function MenuContainer({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const childrenArray = React.Children.toArray(children)
  const totalItems = childrenArray.length

  const checkPlacement = () => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    
    // 1. Available space below in viewport
    const viewportSpaceBelow = window.innerHeight - rect.bottom
    
    // 2. Available space below in closest scroll parent or table container
    let parent = containerRef.current.parentElement
    let parentSpaceBelow = Infinity
    while (parent) {
      const style = window.getComputedStyle(parent)
      const isScrollable =
        style.overflow === "auto" ||
        style.overflow === "scroll" ||
        style.overflowY === "auto" ||
        style.overflowY === "scroll"
      
      if (isScrollable || parent.classList.contains("sl-awb-table-container")) {
        const parentRect = parent.getBoundingClientRect()
        parentSpaceBelow = parentRect.bottom - rect.bottom
        break
      }
      parent = parent.parentElement
    }

    const spaceBelow = Math.min(viewportSpaceBelow, parentSpaceBelow)
    const requiredSpace = (totalItems - 1) * 36 + 10 // 36px per item + 10px buffer
    setOpenUpward(spaceBelow < requiredSpace)
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent document click handler from immediately closing the menu
    if (isExpanded) {
      setIsExpanded(false)
    } else {
      checkPlacement()
      // Dispatch event to close all other menus
      window.dispatchEvent(
        new CustomEvent("sl-close-all-menus", {
          detail: { ref: containerRef }
        })
      );
      setIsExpanded(true)
    }
  }

  // Handle closing all other menus when one is opened
  useEffect(() => {
    const handleCloseAll = (e: Event) => {
      const customEvent = e as CustomEvent<{ ref: React.RefObject<HTMLDivElement | null> }>
      if (customEvent.detail && customEvent.detail.ref !== containerRef) {
        setIsExpanded(false)
      }
    }

    window.addEventListener("sl-close-all-menus", handleCloseAll)
    return () => {
      window.removeEventListener("sl-close-all-menus", handleCloseAll)
    }
  }, [])

  // Handle closing when clicking outside the active menu container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener("click", handleClickOutside)
    }
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [isExpanded])

  // Handle closing when scrolling or resizing the window
  useEffect(() => {
    const handleScrollOrResize = () => {
      setIsExpanded(false)
    }

    if (isExpanded) {
      window.addEventListener("scroll", handleScrollOrResize, true) // Capture all scroll events
      window.addEventListener("resize", handleScrollOrResize)
    }
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true)
      window.removeEventListener("resize", handleScrollOrResize)
    }
  }, [isExpanded])

  return (
    <div 
      ref={containerRef}
      className="relative w-[32px]" 
      data-expanded={isExpanded} 
      style={{ zIndex: isExpanded ? 1000 : 1 }}
    >
      {/* Container for all items */}
      <div className="relative">
        {/* First item - always visible */}
        <div
          className="relative w-8 h-8 bg-white border border-gray-200 cursor-pointer rounded-full group will-change-transform hover:bg-gray-50 transition-colors"
          style={{ zIndex: 100 }}
          onClick={handleToggle}
        >
          {childrenArray[0]}
        </div>

        {/* Other items */}
        {childrenArray.slice(1).map((child, index) => (
          <div
            key={index}
            className="absolute top-0 left-0 w-8 h-8 bg-white border border-gray-200 will-change-transform hover:bg-gray-50 transition-colors"
            style={{
              transform: `translateY(${isExpanded ? (openUpward ? -(index + 1) * 36 : (index + 1) * 36) : 0}px)`,
              opacity: isExpanded ? 1 : 0,
              zIndex: 90 - index,
              clipPath: index === childrenArray.length - 2
                ? "circle(50% at 50% 50%)"
                : "circle(50% at 50% 55%)",
              transition: `transform ${isExpanded ? '300ms' : '300ms'} cubic-bezier(0.4, 0, 0.2, 1),
                         opacity ${isExpanded ? '300ms' : '350ms'}`,
              backfaceVisibility: 'hidden',
              perspective: 1000,
              WebkitFontSmoothing: 'antialiased',
              pointerEvents: isExpanded ? 'auto' : 'none'
            }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
