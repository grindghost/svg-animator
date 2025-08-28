# SVG Animator Pro

A professional SVG animation tool for designers and developers.

## New Features

### 🌙 Dark Mode Support

The app now includes a beautiful dark mode with automatic system theme detection:

- **Theme Toggle**: Click the sun/moon icon in the top-right corner to switch themes
- **System Detection**: Automatically detects and follows your system's dark/light mode preference
- **Persistent Storage**: Remembers your theme choice across browser sessions
- **Smooth Transitions**: Beautiful animations when switching between themes
- **Mobile Optimized**: Responsive design that works great on all devices
- **Accessibility**: High contrast support and reduced motion preferences

### SVG Bounds Visualization

The SVG preview now includes a bounds visualization feature that shows the boundaries of your uploaded SVG:

- **Toggle Button**: Click the grid icon (⊞) in the SVG Preview panel header to show/hide bounds
- **Visual Bounds**: A dashed rectangle shows the SVG's boundaries with dimensions
- **Smart Calculation**: Automatically calculates bounds from viewBox or element content
- **Real-time Updates**: Bounds update when elements are transformed or resized
- **Clean Export**: Bounds are automatically removed when downloading the animated SVG

### Click Outside to Clear Selection

You can now clear the current element selection by clicking outside the SVG elements:

- **Background Click**: Click on the SVG viewer background to clear selection
- **Automatic Cleanup**: Removes selection box, handles, and resets animation controls
- **Visual Feedback**: Status bar updates to confirm selection was cleared
- **Intuitive UX**: Makes it easy to deselect elements without using keyboard shortcuts

## How to Use

1. **Upload an SVG**: Use the file upload button or drag & drop an SVG file
2. **View Bounds**: Click the bounds toggle button (⊞) to see SVG boundaries
3. **Select Elements**: Click on SVG elements to select them
4. **Clear Selection**: Click outside SVG elements or press Escape to clear selection
5. **Animate**: Use the animation controls to add animations to selected elements
6. **Download**: Export your animated SVG with the download button

## Technical Details

- **Dark Mode**: CSS custom properties with JavaScript theme management
- **Theme Persistence**: LocalStorage-based theme storage with system preference fallback
- **Bounds Calculation**: Uses SVG viewBox attribute or calculates from element getBBox()
- **Event Handling**: Implements proper event delegation for SVG element selection
- **Performance**: Debounced window resize handling for smooth bounds updates
- **Clean Export**: Automatically removes UI elements before SVG download
- **Responsive**: Bounds visualization adapts to window resizing

## Browser Support

- Modern browsers with SVG support
- ES6+ JavaScript features
- CSS Grid and Flexbox for layout

## Development

The project uses vanilla JavaScript with modular architecture:
- `theme-manager.js` - Dark/light mode switching and theme management
- `svg-handlers.js` - SVG manipulation and selection
- `file-handler.js` - File upload/download functionality  
- `core.js` - Core application logic
- `main.js` - Application initialization
- `styles.css` - Styling and visual effects
