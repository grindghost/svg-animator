// Theme Manager for SVG Animator Pro
// Handles dark/light mode switching with smooth transitions

class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('theme-toggle');
        this.sunIcon = document.querySelector('.sun-icon');
        this.moonIcon = document.querySelector('.moon-icon');
        this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        
        this.init();
    }
    
    init() {
        try {
            // Apply the current theme
            this.applyTheme(this.currentTheme);
            
            // Add event listener for theme toggle
            if (this.themeToggle) {
                this.themeToggle.addEventListener('click', () => this.toggleTheme());
            } else {
                console.warn('Theme toggle button not found');
            }
            
            // Listen for system theme changes
            this.listenForSystemThemeChanges();
            
            console.log('Theme Manager initialized with theme:', this.currentTheme);
        } catch (error) {
            console.error('Error initializing Theme Manager:', error);
            // Fallback to light theme
            this.applyTheme('light');
        }
    }
    
    getStoredTheme() {
        return localStorage.getItem('svg-animator-theme');
    }
    
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }
    
    storeTheme(theme) {
        localStorage.setItem('svg-animator-theme', theme);
    }
    
    applyTheme(theme) {
        const root = document.documentElement;
        
        // Remove existing theme
        root.removeAttribute('data-theme');
        
        // Apply new theme
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
            this.updateIcons('dark');
        } else {
            this.updateIcons('light');
        }
        
        this.currentTheme = theme;
        this.storeTheme(theme);
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);
        
        // Trigger custom event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }
    
    updateIcons(theme) {
        if (theme === 'dark') {
            this.sunIcon.style.display = 'block';
            this.moonIcon.style.display = 'none';
        } else {
            this.sunIcon.style.display = 'none';
            this.moonIcon.style.display = 'block';
        }
    }
    
    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        if (theme === 'dark') {
            metaThemeColor.content = '#0f172a'; // Dark theme color
        } else {
            metaThemeColor.content = '#f8fafc'; // Light theme color
        }
        
        // Also update apple-mobile-web-app-status-bar-style for iOS
        let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        if (!appleMeta) {
            appleMeta = document.createElement('meta');
            appleMeta.name = 'apple-mobile-web-app-status-bar-style';
            document.head.appendChild(appleMeta);
        }
        appleMeta.content = theme === 'dark' ? 'black-translucent' : 'default';
    }
    
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        
        // Add a subtle animation effect
        this.themeToggle.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.themeToggle.style.transform = 'scale(1)';
        }, 150);
        
        // Show notification
        if (typeof showNotification === 'function') {
            showNotification(`Switched to ${newTheme} mode! 🌙`, 'info');
        } else {
            // Fallback notification
            this.showFallbackNotification(`Switched to ${newTheme} mode! 🌙`);
        }
    }
    
    listenForSystemThemeChanges() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                if (!this.getStoredTheme()) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme(newTheme);
                    
                    if (typeof showNotification === 'function') {
                        showNotification(`System theme changed to ${newTheme} mode`, 'info');
                    } else {
                        this.showFallbackNotification(`System theme changed to ${newTheme} mode`);
                    }
                }
            });
        }
    }
    
    // Public method to get current theme
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    // Public method to set theme programmatically
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme);
        }
    }
    
    // Fallback notification method
    showFallbackNotification(message) {
        // Create a simple toast notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: var(--card-bg);
            color: var(--text-primary);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 12px 16px;
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            font-size: 0.9rem;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.themeManager = new ThemeManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
