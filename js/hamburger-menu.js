/**
 * Hamburger Menu Navigation
 * Handles the hamburger menu toggle and navigation functionality
 */

class HamburgerMenu {
    constructor() {
        this.hamburgerButton = document.getElementById('hamburger-menu');
        this.navOverlay = document.getElementById('nav-overlay');
        this.navClose = document.getElementById('nav-close');
        this.navLinks = document.querySelectorAll('.nav-link');
        
        this.init();
    }
    
    init() {
        if (!this.hamburgerButton || !this.navOverlay) {
            console.warn('Hamburger menu elements not found');
            return;
        }
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Toggle menu when hamburger button is clicked
        this.hamburgerButton.addEventListener('click', () => {
            this.toggleMenu();
        });
        
        // Close menu when close button is clicked
        this.navClose.addEventListener('click', () => {
            this.closeMenu();
        });
        
        // Close menu when clicking on overlay (outside the nav content)
        this.navOverlay.addEventListener('click', (e) => {
            if (e.target === this.navOverlay) {
                this.closeMenu();
            }
        });
        
        // Handle navigation links
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                this.handleNavLinkClick(e);
            });
        });
        
        // Close menu when pressing Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen()) {
                this.closeMenu();
            }
        });
    }
    
    toggleMenu() {
        if (this.isMenuOpen()) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    
    openMenu() {
        this.hamburgerButton.classList.add('active');
        this.navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    
    closeMenu() {
        this.hamburgerButton.classList.remove('active');
        this.navOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
    
    isMenuOpen() {
        return this.navOverlay.classList.contains('active');
    }
    
    handleNavLinkClick(e) {
        const link = e.currentTarget;
        const href = link.getAttribute('href');
        
        // Check if it's a scroll link (starts with #)
        if (href && href.startsWith('#')) {
            e.preventDefault();
            this.handleScrollLink(href);
        } else {
            // For regular page links, close menu and let browser handle navigation
            this.closeMenu();
        }
    }
    
    handleScrollLink(href) {
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            // Close menu first
            this.closeMenu();
            
            // Scroll to target element with smooth behavior
            setTimeout(() => {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 300); // Wait for menu close animation
        } else {
            console.warn(`Target element with id "${targetId}" not found`);
        }
    }
}

// Initialize hamburger menu when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HamburgerMenu();
});
