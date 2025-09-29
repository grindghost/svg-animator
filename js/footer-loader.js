/**
 * Footer Loader - Dynamically loads footer content from footer-config.json
 * This allows centralized management of footer links across all pages
 */

class FooterLoader {
    constructor() {
        this.config = null;
        this.footerElement = null;
    }

    /**
     * Initialize the footer loader
     */
    async init() {
        try {
            // Load the footer configuration
            await this.loadConfig();
            
            // Find the footer element
            this.footerElement = document.querySelector('.app-footer');
            
            if (!this.footerElement) {
                console.warn('Footer element not found');
                return;
            }

            // Render the footer
            this.renderFooter();
        } catch (error) {
            console.error('Error initializing footer loader:', error);
        }
    }

    /**
     * Load footer configuration from JSON file
     */
    async loadConfig() {
        try {
            const response = await fetch('footer-config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.config = await response.json();
        } catch (error) {
            console.error('Error loading footer config:', error);
            // Fallback to a basic config if loading fails
            this.config = {
                footer: {
                    sections: [
                        {
                            title: "SVG Animator Pro",
                            description: "SVG Animation Lab for designers and developers",
                            isMainSection: true
                        }
                    ],
                    bottomText: "&copy; 2024 SVG Animator Pro. All rights reserved."
                }
            };
        }
    }

    /**
     * Render the footer with the loaded configuration
     */
    renderFooter() {
        if (!this.config || !this.footerElement) return;

        const footer = this.config.footer;
        
        // Create footer content HTML
        const footerContent = this.createFooterContent(footer);
        
        // Update the footer element
        this.footerElement.innerHTML = footerContent;
    }

    /**
     * Create the HTML content for the footer
     */
    createFooterContent(footer) {
        let html = '<div class="footer-content">';
        
        // Render each section
        footer.sections.forEach(section => {
            html += this.createFooterSection(section);
        });
        
        html += '</div>';
        
        // Add footer bottom
        if (footer.bottomText) {
            html += `<div class="footer-bottom"><p>${footer.bottomText}</p></div>`;
        }
        
        return html;
    }

    /**
     * Create HTML for a single footer section
     */
    createFooterSection(section) {
        let html = '<div class="footer-section">';
        
        // Section title
        if (section.isMainSection) {
            html += `<h3>${section.title}</h3>`;
        } else {
            html += `<h4>${section.title}</h4>`;
        }
        
        // Section description (for main section)
        if (section.description) {
            html += `<p>${section.description}</p>`;
        }
        
        // Section links
        if (section.links && section.links.length > 0) {
            html += '<ul>';
            section.links.forEach(link => {
                html += this.createFooterLink(link);
            });
            html += '</ul>';
        }
        
        html += '</div>';
        return html;
    }

    /**
     * Create HTML for a single footer link
     */
    createFooterLink(link) {
        let html = '<li>';
        
        // Build link attributes
        let attributes = `href="${link.href}" class="footer-link`;
        if (link.className) {
            attributes += ` ${link.className}`;
        }
        attributes += '"';
        
        if (link.target) {
            attributes += ` target="${link.target}"`;
        }
        
        if (link.rel) {
            attributes += ` rel="${link.rel}"`;
        }
        
        html += `<a ${attributes}>${link.text}</a>`;
        html += '</li>';
        
        return html;
    }

    /**
     * Update a specific section in the footer
     */
    updateSection(sectionTitle, newSection) {
        if (!this.config) return;
        
        const sectionIndex = this.config.footer.sections.findIndex(
            section => section.title === sectionTitle
        );
        
        if (sectionIndex !== -1) {
            this.config.footer.sections[sectionIndex] = newSection;
            this.renderFooter();
        }
    }

    /**
     * Add a new link to a section
     */
    addLinkToSection(sectionTitle, newLink) {
        if (!this.config) return;
        
        const section = this.config.footer.sections.find(
            section => section.title === sectionTitle
        );
        
        if (section) {
            if (!section.links) {
                section.links = [];
            }
            section.links.push(newLink);
            this.renderFooter();
        }
    }

    /**
     * Remove a link from a section
     */
    removeLinkFromSection(sectionTitle, linkText) {
        if (!this.config) return;
        
        const section = this.config.footer.sections.find(
            section => section.title === sectionTitle
        );
        
        if (section && section.links) {
            section.links = section.links.filter(link => link.text !== linkText);
            this.renderFooter();
        }
    }
}

// Initialize footer loader when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const footerLoader = new FooterLoader();
    footerLoader.init();
    
    // Make footerLoader globally available for debugging/manual updates
    window.footerLoader = footerLoader;
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FooterLoader;
}
