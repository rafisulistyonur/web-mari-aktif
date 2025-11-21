/**
 * RESPONSIVE SCALING SYSTEM
 * Menangani auto-scaling dan adaptive layouts untuk desktop dan mobile
 */

class ResponsiveScaler {
    constructor() {
        this.breakpoints = {
            extraSmall: 360,
            small: 576,
            medium: 768,
            large: 992,
            xLarge: 1200,
            xxLarge: 1920
        };
        
        this.currentBreakpoint = this.getCurrentBreakpoint();
        this.init();
    }
    
    /**
     * Initialize responsive scaling
     */
    init() {
        // Listen to window resize events
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const newBreakpoint = this.getCurrentBreakpoint();
                if (newBreakpoint !== this.currentBreakpoint) {
                    this.currentBreakpoint = newBreakpoint;
                    this.onBreakpointChange();
                    console.log('Breakpoint changed to:', newBreakpoint);
                }
            }, 250);
        });
        
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
        
        // Initial setup
        this.setupResponsiveElements();
        this.adjustLayoutForDevice();
    }
    
    /**
     * Get current breakpoint based on window width
     */
    getCurrentBreakpoint() {
        const width = window.innerWidth;
        
        if (width <= this.breakpoints.extraSmall) return 'extraSmall';
        if (width <= this.breakpoints.small) return 'small';
        if (width <= this.breakpoints.medium) return 'medium';
        if (width <= this.breakpoints.large) return 'large';
        if (width <= this.breakpoints.xLarge) return 'xLarge';
        return 'xxLarge';
    }
    
    /**
     * Adjust layout when breakpoint changes
     */
    onBreakpointChange() {
        this.adjustLayoutForDevice();
        this.adjustImages();
        this.adjustModals();
    }
    
    /**
     * Handle orientation changes
     */
    handleOrientationChange() {
        // Reset any transform/scale that might be applied
        document.body.style.transform = 'none';
        document.documentElement.style.transform = 'none';
        
        // Reflow layout
        this.onBreakpointChange();
    }
    
    /**
     * Setup responsive behavior for common elements
     */
    setupResponsiveElements() {
        const breakpoint = this.currentBreakpoint;
        
        // Adjust sidebar visibility on mobile
        if (breakpoint === 'small' || breakpoint === 'extraSmall') {
            this.makeSidebarResponsive();
        }
        
        // Adjust search bar width
        this.adjustSearchBar();
        
        // Adjust post creator
        this.adjustPostCreator();
    }
    
    /**
     * Make sidebar responsive
     */
    makeSidebarResponsive() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        
        const profileCard = sidebar.querySelector('.profile-card');
        const sidebarSection = sidebar.querySelector('.sidebar-section');
        
        if (this.currentBreakpoint === 'extraSmall') {
            // On very small screens, stack vertically
            sidebar.style.display = 'flex';
            sidebar.style.flexDirection = 'column';
            
            // Make scrollable instead of sticky on mobile
            if (profileCard) {
                profileCard.style.position = 'static';
            }
        }
    }
    
    /**
     * Adjust search bar responsively
     */
    adjustSearchBar() {
        const searchInput = document.querySelector('.search-input');
        if (!searchInput) return;
        
        const widths = {
            xxLarge: '450px',
            xLarge: '400px',
            large: '350px',
            medium: '250px',
            small: '200px',
            extraSmall: '150px'
        };
        
        searchInput.style.width = widths[this.currentBreakpoint] || '200px';
    }
    
    /**
     * Adjust post creator
     */
    adjustPostCreator() {
        const postActions = document.querySelector('.post-actions');
        if (!postActions) return;
        
        if (this.currentBreakpoint === 'small' || this.currentBreakpoint === 'extraSmall') {
            postActions.style.display = 'none';
        } else {
            postActions.style.display = 'flex';
        }
    }
    
    /**
     * Adjust layout for device type (mobile vs desktop)
     */
    adjustLayoutForDevice() {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;
        
        const isMobile = this.currentBreakpoint === 'small' || 
                         this.currentBreakpoint === 'extraSmall';
        
        if (isMobile) {
            // Mobile layout
            mainContent.style.gridTemplateColumns = '1fr';
            mainContent.style.gap = '8px';
            mainContent.style.padding = '8px';
        } else if (this.currentBreakpoint === 'medium') {
            // Tablet layout
            mainContent.style.gridTemplateColumns = '180px 1fr';
            mainContent.style.gap = '12px';
            mainContent.style.padding = '12px';
        } else {
            // Desktop layout
            mainContent.style.gridTemplateColumns = '260px 1fr';
            mainContent.style.gap = '20px';
            mainContent.style.padding = '20px';
        }
    }
    
    /**
     * Adjust images for different screen sizes
     */
    adjustImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
        });
    }
    
    /**
     * Adjust modal sizing
     */
    adjustModals() {
        const modals = document.querySelectorAll('.modal-content');
        modals.forEach(modal => {
            if (this.currentBreakpoint === 'small' || this.currentBreakpoint === 'extraSmall') {
                modal.style.width = '100%';
                modal.style.maxWidth = '100%';
                modal.style.margin = '10px';
            } else {
                modal.style.width = '90%';
                modal.style.maxWidth = '500px';
            }
        });
    }
    
    /**
     * Get current viewport info
     */
    getViewportInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            breakpoint: this.currentBreakpoint,
            isMobile: this.currentBreakpoint === 'small' || this.currentBreakpoint === 'extraSmall',
            isTablet: this.currentBreakpoint === 'medium' || this.currentBreakpoint === 'large',
            isDesktop: this.currentBreakpoint === 'xLarge' || this.currentBreakpoint === 'xxLarge',
            orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
        };
    }
    
    /**
     * Detect if device is touch-enabled
     */
    isTouchDevice() {
        return (('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                (navigator.msMaxTouchPoints > 0));
    }
    
    /**
     * Adjust for notch/safe area (iPhone X, etc)
     */
    adjustForSafeArea() {
        const appRoot = document.querySelector('body');
        if (!appRoot) return;
        
        // Apply safe area padding if supported
        if (CSS.supports('padding-top: max(0px, env(safe-area-inset-top))')) {
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                navbar.style.paddingTop = 'env(safe-area-inset-top)';
                navbar.style.paddingLeft = 'env(safe-area-inset-left)';
                navbar.style.paddingRight = 'env(safe-area-inset-right)';
            }
        }
    }
    
    /**
     * Prevent zoom on input focus (iOS)
     */
    preventInputZoom() {
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                // Minimum font size to prevent zoom on iOS
                if (this.style.fontSize === '') {
                    this.style.fontSize = '16px';
                }
            });
        });
    }
    
    /**
     * Get safe scaling factor
     */
    getScaleFactor() {
        const width = window.innerWidth;
        const factors = {
            xxLarge: 1.1,
            xLarge: 1,
            large: 0.95,
            medium: 0.9,
            small: 0.85,
            extraSmall: 0.8
        };
        return factors[this.currentBreakpoint] || 1;
    }
}

/**
 * Initialize responsive scaler when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.responsiveScaler = new ResponsiveScaler();
        
        // Apply safe area adjustments
        window.responsiveScaler.adjustForSafeArea();
        
        // Prevent input zoom
        window.responsiveScaler.preventInputZoom();
        
        // Log viewport info (development)
        if (typeof console !== 'undefined') {
            console.log('Responsive Scaler initialized');
            console.log('Viewport:', window.responsiveScaler.getViewportInfo());
            console.log('Is Touch Device:', window.responsiveScaler.isTouchDevice());
        }
    });
} else {
    window.responsiveScaler = new ResponsiveScaler();
    window.responsiveScaler.adjustForSafeArea();
    window.responsiveScaler.preventInputZoom();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponsiveScaler;
}
