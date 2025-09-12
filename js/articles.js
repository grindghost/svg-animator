/**
 * Articles Manager
 * Handles loading and displaying articles from articles.json
 */

class ArticlesManager {
    constructor() {
        this.articlesGrid = document.getElementById('articles-grid');
        this.articles = [];
        
        this.init();
    }
    
    async init() {
        if (!this.articlesGrid) {
            console.warn('Articles grid element not found');
            return;
        }
        
        try {
            await this.loadArticles();
            this.renderArticles();
        } catch (error) {
            console.error('Failed to load articles:', error);
            this.showError();
        }
    }
    
    async loadArticles() {
        try {
            const response = await fetch('articles.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.articles = data.articles || [];
        } catch (error) {
            console.error('Failed to fetch articles:', error);
            throw error;
        }
    }
    
    renderArticles() {
        if (!this.articles.length) {
            this.showEmpty();
            return;
        }
        
        this.articlesGrid.innerHTML = '';
        
        this.articles.forEach(article => {
            const articleCard = this.createArticleCard(article);
            this.articlesGrid.appendChild(articleCard);
        });
    }
    
    createArticleCard(article) {
        const card = document.createElement('a');
        card.className = 'article-card';
        card.href = article.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        
        const content = document.createElement('div');
        content.className = 'article-content';
        
        const title = document.createElement('h3');
        title.className = 'article-title';
        title.textContent = article.title;
        
        const author = document.createElement('div');
        author.className = 'article-author';
        author.textContent = `By ${article.author}`;
        
        const description = document.createElement('p');
        description.className = 'article-description';
        const trimmedDescription = this.trimDescription(article.description, 120);
        description.innerHTML = trimmedDescription;
        
        const url = document.createElement('div');
        url.className = 'article-url';
        url.textContent = this.trimUrl(article.url);
        
        content.appendChild(title);
        content.appendChild(author);
        content.appendChild(description);
        content.appendChild(url);
        
        card.appendChild(content);
        
        return card;
    }
    
    trimDescription(description, maxLength) {
        if (description.length <= maxLength) {
            return description;
        }
        
        const trimmed = description.substring(0, maxLength).trim();
        const lastSpace = trimmed.lastIndexOf(' ');
        const finalText = lastSpace > 0 ? trimmed.substring(0, lastSpace) : trimmed;
        
        return `${finalText}... <span class="read-more-badge">read more</span>`;
    }
    
    trimUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname + urlObj.pathname;
        } catch (error) {
            // Fallback for invalid URLs
            return url.length > 50 ? url.substring(0, 50) + '...' : url;
        }
    }
    
    showEmpty() {
        this.articlesGrid.innerHTML = `
            <div class="articles-empty">
                <div class="empty-icon">📚</div>
                <h3>No articles available</h3>
                <p>Check back later for interesting articles about SVG animation!</p>
            </div>
        `;
    }
    
    showError() {
        this.articlesGrid.innerHTML = `
            <div class="articles-error">
                <div class="error-icon">⚠️</div>
                <h3>Failed to load articles</h3>
                <p>There was an error loading the articles. Please try refreshing the page.</p>
            </div>
        `;
    }
}

// Initialize articles manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ArticlesManager();
});
