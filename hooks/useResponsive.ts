import { useState, useEffect } from 'react';

interface ResponsiveState {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    width: number;
}

export const useResponsive = (): ResponsiveState => {
    const [state, setState] = useState<ResponsiveState>(() => {
        if (typeof window === 'undefined') {
            return { isMobile: false, isTablet: false, isDesktop: true, width: 1920 };
        }

        const width = window.innerWidth;
        return {
            isMobile: width < 768,
            isTablet: width >= 768 && width < 1024,
            isDesktop: width >= 1024,
            width
        };
    });

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setState({
                isMobile: width < 768,
                isTablet: width >= 768 && width < 1024,
                isDesktop: width >= 1024,
                width
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return state;
};
