/**
 * Hamburger Menu Navigation
 * Handles the hamburger menu toggle and navigation functionality
 * Dynamically generates menu content from navigation-config.json
 */

class HamburgerMenu {
    constructor() {
        this.hamburgerButton = document.getElementById('hamburger-menu');
        this.navOverlay = document.getElementById('nav-overlay');
        this.navClose = document.getElementById('nav-close');
        this.navMenu = document.querySelector('.nav-menu');
        this.navLinks = [];
        this.navigationConfig = null;
        
        this.init();
    }
    
    async init() {
        if (!this.hamburgerButton || !this.navOverlay) {
            console.warn('Hamburger menu elements not found');
            return;
        }
        
        // Load navigation configuration
        await this.loadNavigationConfig();
        
        // Generate menu content
        this.generateMenuContent();
        
        // Bind events after content is generated
        this.bindEvents();
    }
    
    async loadNavigationConfig() {
        try {
            const response = await fetch('navigation-config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.navigationConfig = await response.json();
        } catch (error) {
            console.error('Failed to load navigation configuration:', error);
            // Fallback to default configuration
            this.navigationConfig = {
                navigation: {
                    sections: [
                        {
                            title: "Pages",
                            links: [
                                { href: "index.html", text: "🏠 Home", icon: "🏠" },
                                { href: "origin-story.html", text: "📖 Origin Story", icon: "📖" },
                                { href: "documentation.html", text: "📚 Documentation", icon: "📚" },
                                { href: "privacy-policy.html", text: "🔒 Privacy Policy", icon: "🔒" },
                                { href: "terms-of-service.html", text: "📋 Terms of Service", icon: "📋" }
                            ]
                        }
                    ],
                    pageSpecificSections: {}
                }
            };
        }
    }
    
    generateMenuContent() {
        if (!this.navMenu || !this.navigationConfig) {
            console.warn('Cannot generate menu content: missing elements or config');
            return;
        }
        
        // Clear existing content
        this.navMenu.innerHTML = '';
        
        // Get current page filename
        const currentPage = this.getCurrentPage();
        
        // Generate sections
        const sections = [...this.navigationConfig.navigation.sections];
        
        // Add page-specific sections if they exist
        if (this.navigationConfig.navigation.pageSpecificSections[currentPage]) {
            sections.push(...this.navigationConfig.navigation.pageSpecificSections[currentPage]);
        }
        
        // Generate HTML for each section
        sections.forEach(section => {
            const sectionElement = this.createSectionElement(section);
            this.navMenu.appendChild(sectionElement);
        });
        
        // Update navLinks after generating content
        this.navLinks = document.querySelectorAll('.nav-link');
    }
    
    createSectionElement(section) {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'nav-section';
        
        const title = document.createElement('h4');
        title.textContent = section.title;
        sectionDiv.appendChild(title);
        
        const ul = document.createElement('ul');
        
        section.links.forEach(link => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.text;
            a.className = 'nav-link';
            
            // Add scroll-link class for scroll links
            if (link.isScrollLink) {
                a.classList.add('scroll-link');
            }
            
            li.appendChild(a);
            ul.appendChild(li);
        });
        
        sectionDiv.appendChild(ul);
        return sectionDiv;
    }
    
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename || 'index.html';
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
