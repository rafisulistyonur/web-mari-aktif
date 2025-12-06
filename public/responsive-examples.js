/**
 * RESPONSIVE IMPLEMENTATION EXAMPLES
 * Contoh implementasi responsive system untuk halaman lain
 */

// ===============================================
// CONTOH 1: Grid Layout Responsif
// ===============================================

function setupResponsiveGrid() {
    const grid = document.querySelector('.items-grid');
    if (!grid) return;
    
    const scaler = window.responsiveScaler;
    const breakpoint = scaler.currentBreakpoint;
    
    const columns = {
        'xxLarge': 4,
        'xLarge': 3,
        'large': 3,
        'medium': 2,
        'small': 1,
        'extraSmall': 1
    };
    
    const cols = columns[breakpoint] || 2;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
}

// ===============================================
// CONTOH 2: Sidebar Toggle untuk Mobile
// ===============================================

function setupSidebarToggle() {
    const scaler = window.responsiveScaler;
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (!sidebar || !mainContent) return;
    
    if (scaler.currentBreakpoint === 'small' || scaler.currentBreakpoint === 'extraSmall') {
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        toggleBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: #2777b9;
            color: white;
            border: none;
            cursor: pointer;
            z-index: 999;
            font-size: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        document.body.appendChild(toggleBtn);
        
        // Toggle sidebar visibility
        let sidebarVisible = false;
        toggleBtn.addEventListener('click', () => {
            sidebarVisible = !sidebarVisible;
            sidebar.style.display = sidebarVisible ? 'flex' : 'none';
            toggleBtn.style.opacity = sidebarVisible ? '0.8' : '1';
        });
    }
}

// ===============================================
// CONTOH 3: Dynamic Font Sizing
// ===============================================

function setupDynamicFontSizing() {
    const scaler = window.responsiveScaler;
    const factor = scaler.getScaleFactor();
    
    // Apply scale to specific elements
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
        const baseSize = parseFloat(window.getComputedStyle(heading).fontSize);
        heading.style.fontSize = (baseSize * factor) + 'px';
    });
}

// ===============================================
// CONTOH 4: Adaptive Image Loading
// ===============================================

function setupAdaptiveImages() {
    const scaler = window.responsiveScaler;
    const images = document.querySelectorAll('img[data-responsive]');
    
    images.forEach(img => {
        const srcset = img.dataset.srcset;
        if (!srcset) return;
        
        // Parse srcset: "small.jpg 360w, medium.jpg 768w, large.jpg 1920w"
        const sizes = srcset.split(',').map(s => {
            const [src, width] = s.trim().split(' ');
            return { src, width: parseInt(width) };
        });
        
        // Select appropriate image based on current viewport
        const currentWidth = window.innerWidth;
        const bestSize = sizes.reduce((best, current) => {
            return Math.abs(current.width - currentWidth) < 
                   Math.abs(best.width - currentWidth) ? current : best;
        });
        
        img.src = bestSize.src;
    });
}

// ===============================================
// CONTOH 5: Touch-Friendly Navigation
// ===============================================

function setupTouchNavigation() {
    const scaler = window.responsiveScaler;
    const isTouchDevice = scaler.isTouchDevice();
    
    if (isTouchDevice) {
        // Add touch-friendly classes
        document.body.classList.add('touch-device');
        
        // Increase button padding for touch
        const buttons = document.querySelectorAll('button, a.button');
        buttons.forEach(btn => {
            btn.style.padding = '12px 16px';
            btn.style.minHeight = '44px';
            btn.style.minWidth = '44px';
        });
    }
}

// ===============================================
// CONTOH 6: Breakpoint-Specific Behavior
// ===============================================

function setupBreakpointBehavior() {
    const scaler = window.responsiveScaler;
    const info = scaler.getViewportInfo();
    
    if (info.isMobile) {
        console.log('Mobile layout active');
        // Mobile-specific setup
        setupMobileMenu();
        setupMobileSearch();
    } else if (info.isTablet) {
        console.log('Tablet layout active');
        // Tablet-specific setup
        setupTabletMenu();
    } else if (info.isDesktop) {
        console.log('Desktop layout active');
        // Desktop-specific setup
        setupDesktopMenu();
    }
}

// ===============================================
// CONTOH 7: Responsive Modal
// ===============================================

function showResponsiveModal(content) {
    const scaler = window.responsiveScaler;
    const isMobile = scaler.currentBreakpoint === 'small' || 
                     scaler.currentBreakpoint === 'extraSmall';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 2000;
        display: flex;
        align-items: ${isMobile ? 'flex-end' : 'center'};
        justify-content: center;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
        background: white;
        border-radius: ${isMobile ? '16px 16px 0 0' : '8px'};
        width: ${isMobile ? '100%' : '90%'};
        max-width: ${isMobile ? '100%' : '500px'};
        padding: 20px;
        max-height: ${isMobile ? '80vh' : '90vh'};
        overflow-y: auto;
        animation: slideUp 0.3s ease;
    `;
    
    modalContent.innerHTML = content;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    return modal;
}

// ===============================================
// CONTOH 8: Responsive Table
// ===============================================

function makeTableResponsive() {
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
        const scaler = window.responsiveScaler;
        
        if (scaler.currentBreakpoint === 'small' || 
            scaler.currentBreakpoint === 'extraSmall') {
            // Convert table to card layout on mobile
            const rows = table.querySelectorAll('tbody tr');
            const headers = table.querySelectorAll('thead th');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                cells.forEach((cell, index) => {
                    if (headers[index]) {
                        cell.setAttribute('data-label', headers[index].textContent);
                    }
                });
            });
            
            table.classList.add('responsive-table');
        }
    });
}

// ===============================================
// CONTOH 9: Lazy Load Elements
// ===============================================

function setupLazyLoading() {
    const scaler = window.responsiveScaler;
    
    // Only lazy load on slower connections or mobile
    if (scaler.currentBreakpoint === 'small' || 
        scaler.currentBreakpoint === 'medium') {
        
        const lazyElements = document.querySelectorAll('[data-lazy]');
        
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    if (el.dataset.lazy === 'image') {
                        el.src = el.dataset.src;
                    } else if (el.dataset.lazy === 'background') {
                        el.style.backgroundImage = `url(${el.dataset.src})`;
                    }
                    observer.unobserve(el);
                }
            });
        });
        
        lazyElements.forEach(el => observer.observe(el));
    }
}

// ===============================================
// CONTOH 10: Responsive Notification Toast
// ===============================================

function showResponsiveToast(message, duration = 3000) {
    const scaler = window.responsiveScaler;
    const isMobile = scaler.currentBreakpoint === 'small' || 
                     scaler.currentBreakpoint === 'extraSmall';
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        ${isMobile ? 'bottom: 20px;' : 'top: 80px;'}
        ${isMobile ? 'left: 10px; right: 10px;' : 'left: 50%; transform: translateX(-50%);'}
        background-color: #333;
        color: white;
        padding: 16px;
        border-radius: 8px;
        z-index: 3000;
        animation: slideInUp 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ===============================================
// INITIALIZATION
// ===============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResponsiveFeatures);
} else {
    initResponsiveFeatures();
}

function initResponsiveFeatures() {
    // Setup responsive components
    setupResponsiveGrid();
    setupSidebarToggle();
    setupBreakpointBehavior();
    setupTouchNavigation();
    setupAdaptiveImages();
    setupLazyLoading();
    
    // Re-setup on breakpoint changes
    window.addEventListener('resize', () => {
        setupResponsiveGrid();
        setupDynamicFontSizing();
    });
}

// ===============================================
// ANIMATIONS (CSS for animations)
// ===============================================
/*
@keyframes slideUp {
    from {
        transform: translateY(100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes slideInUp {
    from {
        transform: translateY(100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes slideOutDown {
    from {
        transform: translateY(0);
        opacity: 1;
    }
    to {
        transform: translateY(100%);
        opacity: 0;
    }
}
*/

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setupResponsiveGrid,
        setupSidebarToggle,
        setupDynamicFontSizing,
        setupAdaptiveImages,
        setupTouchNavigation,
        setupBreakpointBehavior,
        showResponsiveModal,
        makeTableResponsive,
        setupLazyLoading,
        showResponsiveToast
    };
}
