// Browser-Compatible SVG Minifier
// SVG Animator Pro - SVG Minifier Browser Module

/**
 * Browser-compatible SVG minification (whitespace only)
 * @param {string} svgContent - The SVG content as a string
 * @returns {string} Minified SVG content
 */
function minifySVGBrowser(svgContent) {
    try {
        let minified = svgContent;

        // Only remove whitespace - don't touch any SVG elements or attributes
        
        // Remove XML comments (optional - uncomment if you want to remove comments)
        // minified = minified.replace(/<!--[\s\S]*?-->/g, '');

        // Remove excessive whitespace between tags
        minified = minified.replace(/>\s+</g, '><');
        
        // Remove leading and trailing whitespace
        minified = minified.trim();
        
        // Replace multiple consecutive spaces/tabs/newlines with single space
        minified = minified.replace(/[ \t\n\r]+/g, ' ');

        return minified;

    } catch (error) {
        console.warn('SVG minification failed, returning original content:', error);
        return svgContent;
    }
}

// Create a global SVGO object to match the expected API
window.SVGO = {
    optimize: minifySVGBrowser
};

// Also provide the function directly
window.minifySVGBrowser = minifySVGBrowser;
