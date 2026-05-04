import React from 'react';

interface ThemeToggleProps {
    showLabel?: boolean;
    variant?: 'icon' | 'button' | 'dropdown';
}

// DARK MODE ONLY - Theme toggle disabled
export function ThemeToggle({ showLabel = false, variant = 'icon' }: ThemeToggleProps) {
    // Return empty element - no theme switching allowed
    return null;
}

export default ThemeToggle;
