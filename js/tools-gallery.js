/**
 * SVG Tools Gallery Manager
 * Handles loading and rendering of SVG tools from JSON data
 */

class ToolsGallery {
    constructor() {
        this.toolsGrid = document.getElementById('tools-grid');
        this.toolsData = null;
        this.selectedTags = [];
        this.searchTerm = '';
        
        // Filter elements
        this.searchInput = document.getElementById('search-input');
        this.clearSearchBtn = document.getElementById('clear-search');
        this.clearTagsBtn = document.getElementById('clear-tags');
        this.tagButtonsContainer = document.getElementById('tag-buttons');
        
        if (!this.toolsGrid) {
            console.error('Tools grid element not found!');
            return;
        }
        
        this.init();
        this.setupEventListeners();
    }

    async init() {
        try {
            await this.loadTools();
            this.renderTagButtons();
            this.renderTools();
        } catch (error) {
            console.error('Failed to load tools gallery:', error);
            this.showError();
        }
    }

    async loadTools() {
        try {
            this.showLoading();
            
            // Try to load the JSON file
            const response = await fetch('./tools.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.toolsData = data.tools;
        } catch (error) {
            console.error('Error loading tools data:', error);
            
            // Fallback: use hardcoded data if fetch fails
            this.toolsData = [
                {
                    name: "SVG-Edit",
                    description: "A powerful browser-based SVG editor with advanced drawing tools and shape manipulation capabilities.",
                    image: "https://via.placeholder.com/300x200/6366f1/ffffff?text=SVG-Edit",
                    url: "https://svg-edit.github.io/svgedit/",
                    tags: ["editing", "authoring", "browser-based"]
                },
                {
                    name: "Figma",
                    description: "Professional design tool with excellent SVG support for creating and editing vector graphics.",
                    image: "https://via.placeholder.com/300x200/10b981/ffffff?text=Figma",
                    url: "https://www.figma.com/",
                    tags: ["editing", "authoring", "collaboration", "design"]
                },
                {
                    name: "Inkscape",
                    description: "Free and open-source vector graphics editor with comprehensive SVG editing features.",
                    image: "https://via.placeholder.com/300x200/ef4444/ffffff?text=Inkscape",
                    url: "https://inkscape.org/",
                    tags: ["editing", "authoring", "open-source", "desktop"]
                }
            ];
        }
    }

    renderTools() {
        if (!this.toolsData || this.toolsData.length === 0) {
            this.showError();
            return;
        }

        // Apply filters
        this.applyFilters();
    }

    applyFilters() {
        this.toolsGrid.innerHTML = '';
        this.toolsGrid.classList.remove('loading', 'error');

        let filteredTools = this.toolsData;

        // Filter by search term
        if (this.searchTerm) {
            filteredTools = filteredTools.filter(tool => 
                tool.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                tool.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (tool.tags && tool.tags.some(tag => tag.toLowerCase().includes(this.searchTerm.toLowerCase())))
            );
        }

        // Filter by selected tags
        if (this.selectedTags.length > 0) {
            filteredTools = filteredTools.filter(tool => 
                tool.tags && tool.tags.some(tag => this.selectedTags.includes(tag))
            );
        }

        // Render filtered tools
        filteredTools.forEach(tool => {
            const toolCard = this.createToolCard(tool);
            this.toolsGrid.appendChild(toolCard);
        });

        // Add animation delay to cards for staggered effect
        const cards = this.toolsGrid.querySelectorAll('.tool-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in-up');
        });
    }

    createToolCard(tool) {
        const card = document.createElement('div');
        card.className = 'tool-card';
        card.setAttribute('data-tool-name', tool.name);

        // Truncate description if too long
        const truncatedDescription = this.truncateText(tool.description, 120);

        // Create tags HTML if tags exist
        const tagsHtml = tool.tags && tool.tags.length > 0 
            ? `<div class="tool-tags">${tool.tags.map(tag => `<span class="tool-tag">${tag}</span>`).join('')}</div>`
            : '';

        card.innerHTML = `
            <img src="${tool.image}" alt="${tool.name} screenshot" class="tool-image" loading="lazy">
            <div class="tool-content">
                <h3 class="tool-name">${tool.name}</h3>
                <p class="tool-description">${truncatedDescription}</p>
                ${tagsHtml}
                <a href="${tool.url}" target="_blank" rel="noopener noreferrer" class="tool-link">
                    Visit Tool
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                </a>
            </div>
        `;

        // Add click handler for the entire card
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on the link itself
            if (e.target.closest('.tool-link')) {
                return;
            }
            
            // Open the tool URL in a new tab
            window.open(tool.url, '_blank', 'noopener,noreferrer');
        });

        // Add keyboard support
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Open ${tool.name} in a new tab`);

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.open(tool.url, '_blank', 'noopener,noreferrer');
            }
        });

        return card;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength).trim() + '...';
    }

    showLoading() {
        this.toolsGrid.innerHTML = '';
        this.toolsGrid.classList.add('loading');
        this.toolsGrid.classList.remove('error');
    }

    showError() {
        this.toolsGrid.innerHTML = '';
        this.toolsGrid.classList.add('error');
        this.toolsGrid.classList.remove('loading');
        
        this.toolsGrid.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                <div style="font-size: 2rem; margin-bottom: 16px;">⚠️</div>
                <h3 style="margin-bottom: 12px; color: var(--text-primary);">Unable to load tools</h3>
                <p style="margin-bottom: 20px;">There was an error loading the SVG tools gallery.</p>
                <button onclick="location.reload()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Retry
                </button>
            </div>
        `;
    }

    // Method to refresh the tools gallery
    async refresh() {
        await this.init();
    }

    // Method to filter tools by name or tags (for future search functionality)
    filterTools(searchTerm, selectedTags = []) {
        if (!this.toolsData) return;

        let filteredTools = this.toolsData;

        // Filter by search term
        if (searchTerm) {
            filteredTools = filteredTools.filter(tool => 
                tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (tool.tags && tool.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
            );
        }

        // Filter by selected tags
        if (selectedTags.length > 0) {
            filteredTools = filteredTools.filter(tool => 
                tool.tags && tool.tags.some(tag => selectedTags.includes(tag))
            );
        }

        this.toolsGrid.innerHTML = '';
        filteredTools.forEach(tool => {
            const toolCard = this.createToolCard(tool);
            this.toolsGrid.appendChild(toolCard);
        });

        // Add animation delay to cards for staggered effect
        const cards = this.toolsGrid.querySelectorAll('.tool-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in-up');
        });
    }

    // Method to get all unique tags from tools
    getAllTags() {
        if (!this.toolsData) return [];
        
        const allTags = new Set();
        this.toolsData.forEach(tool => {
            if (tool.tags) {
                tool.tags.forEach(tag => allTags.add(tag));
            }
        });
        
        return Array.from(allTags).sort();
    }

    renderTagButtons() {
        if (!this.tagButtonsContainer) return;
        
        const allTags = this.getAllTags();
        this.tagButtonsContainer.innerHTML = '';
        
        allTags.forEach(tag => {
            const button = document.createElement('button');
            button.className = 'tag-filter-btn';
            button.textContent = tag;
            button.setAttribute('data-tag', tag);
            
            button.addEventListener('click', () => {
                this.toggleTag(tag);
            });
            
            this.tagButtonsContainer.appendChild(button);
        });
    }

    toggleTag(tag) {
        const index = this.selectedTags.indexOf(tag);
        if (index > -1) {
            this.selectedTags.splice(index, 1);
        } else {
            this.selectedTags.push(tag);
        }
        
        this.updateTagButtons();
        this.applyFilters();
    }

    updateTagButtons() {
        const buttons = this.tagButtonsContainer.querySelectorAll('.tag-filter-btn');
        buttons.forEach(button => {
            const tag = button.getAttribute('data-tag');
            if (this.selectedTags.includes(tag)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    setupEventListeners() {
        // Search input
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.updateClearSearchButton();
                this.applyFilters();
            });
        }

        // Clear search button
        if (this.clearSearchBtn) {
            this.clearSearchBtn.addEventListener('click', () => {
                this.searchTerm = '';
                this.searchInput.value = '';
                this.updateClearSearchButton();
                this.applyFilters();
            });
        }

        // Clear tags button
        if (this.clearTagsBtn) {
            this.clearTagsBtn.addEventListener('click', () => {
                this.selectedTags = [];
                this.updateTagButtons();
                this.applyFilters();
            });
        }
    }

    updateClearSearchButton() {
        if (this.clearSearchBtn) {
            if (this.searchTerm) {
                this.clearSearchBtn.classList.add('visible');
            } else {
                this.clearSearchBtn.classList.remove('visible');
            }
        }
    }
}

// Initialize the tools gallery when the DOM is loaded
let toolsGalleryInstance = null;

function initializeToolsGallery() {
    if (toolsGalleryInstance) {
        return;
    }
    
    toolsGalleryInstance = new ToolsGallery();
}

document.addEventListener('DOMContentLoaded', () => {
    initializeToolsGallery();
});

// Also try to initialize immediately if DOM is already loaded
if (document.readyState !== 'loading') {
    initializeToolsGallery();
}

// Add CSS for fade-in animation
const toolsGalleryStyle = document.createElement('style');
toolsGalleryStyle.id = 'tools-gallery-styles';
toolsGalleryStyle.textContent = `
    .tool-card.fade-in-up {
        animation: fadeInUp 0.6s ease-out forwards;
        opacity: 0;
        transform: translateY(20px);
    }

    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
`;

// Only add the style if it doesn't already exist
if (!document.getElementById('tools-gallery-styles')) {
    document.head.appendChild(toolsGalleryStyle);
}
