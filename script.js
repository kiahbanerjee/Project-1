const container = document.querySelector('.library-container');
const grid = document.querySelector('.library-grid');

// State for dragging and position
let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;

// Velocity for momentum scrolling
let velocityX = 0;
let velocityY = 0;
let lastMoveTime = 0;
let lastMoveX = 0;
let lastMoveY = 0;

// Grid configuration
const CARD_WIDTH = 200;  // Changed from 400
const CARD_HEIGHT = 250; // Changed from 500
const MIN_SPACING = 50;  // Minimum space between cards
const GRID_CELL_SIZE = 300; // Size of grid cells for positioning

// Track which cards exist at which grid positions
const cardPositions = new Set();
const cardLocations = new Map(); // Store actual x,y positions

// Random offset within a grid cell
function getRandomOffset() {
    return Math.random() * 100 - 50; // Random offset between -50 and 50
}

// Create initial grid of cards
function createInitialCards() {
    // Create a 6x6 grid centered around origin
    for (let row = -3; row < 3; row++) {
        for (let col = -3; col < 3; col++) {
            createCardAt(row, col);
        }
    }
}

// Create a card at a specific grid position
function createCardAt(row, col) {
    const key = `${row},${col}`;
    if (cardPositions.has(key)) return; // Already exists
    
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.row = row;
    card.dataset.col = col;
    
    // All cards the same color
    card.style.background = '#fff';
    
    // Calculate base position with random offset
    const baseX = col * GRID_CELL_SIZE;
    const baseY = row * GRID_CELL_SIZE;
    const x = baseX + getRandomOffset();
    const y = baseY + getRandomOffset();
    
    // Store the actual position
    cardLocations.set(key, { x, y });
    
    // Position the card
    card.style.position = 'absolute';
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
    
    grid.appendChild(card);
    cardPositions.add(key);
}

// Check if we need to create more cards based on current position
function updateVisibleCards() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate which grid cells are visible (with buffer)
    const buffer = 2;
    
    const minCol = Math.floor((-currentX - viewportWidth) / GRID_CELL_SIZE) - buffer;
    const maxCol = Math.ceil((-currentX + viewportWidth) / GRID_CELL_SIZE) + buffer;
    const minRow = Math.floor((-currentY - viewportHeight) / GRID_CELL_SIZE) - buffer;
    const maxRow = Math.ceil((-currentY + viewportHeight) / GRID_CELL_SIZE) + buffer;
    
    // Create cards in visible range
    for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
            createCardAt(row, col);
        }
    }
    
    // Optional: Remove cards that are too far away (memory optimization)
    removeDistantCards(minRow, maxRow, minCol, maxCol);
}

// Remove cards that are far from viewport
function removeDistantCards(minRow, maxRow, minCol, maxCol) {
    const buffer = 4;
    const cards = grid.querySelectorAll('.card');
    
    cards.forEach(card => {
        const row = parseInt(card.dataset.row);
        const col = parseInt(card.dataset.col);
        
        if (row < minRow - buffer || row > maxRow + buffer || 
            col < minCol - buffer || col > maxCol + buffer) {
            const key = `${row},${col}`;
            cardPositions.delete(key);
            cardLocations.delete(key);
            card.remove();
        }
    });
}

// Update grid transform
function updateTransform() {
    grid.style.transform = `translateX(${currentX}px) translateY(${currentY}px)`;
    updateVisibleCards();
}

// === MOUSE EVENTS ===

container.addEventListener('mousedown', (e) => {
    isDragging = true;
    container.classList.add('dragging');
    
    startX = e.pageX;
    startY = e.pageY;
    
    velocityX = 0;
    velocityY = 0;
});

container.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const deltaX = e.pageX - startX;
    const deltaY = e.pageY - startY;
    
    currentX += deltaX;
    currentY += deltaY;
    
    startX = e.pageX;
    startY = e.pageY;
    
    updateTransform();
});

container.addEventListener('mouseup', () => {
    isDragging = false;
    container.classList.remove('dragging');
});

container.addEventListener('mouseleave', () => {
    isDragging = false;
    container.classList.remove('dragging');
});

// === TOUCH EVENTS ===

container.addEventListener('touchstart', (e) => {
    isDragging = true;
    
    const touch = e.touches[0];
    startX = touch.pageX;
    startY = touch.pageY;
    
    lastMoveX = touch.pageX;
    lastMoveY = touch.pageY;
    lastMoveTime = Date.now();
    velocityX = 0;
    velocityY = 0;
}, { passive: true });

container.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = touch.pageX - startX;
    const deltaY = touch.pageY - startY;
    
    currentX += deltaX;
    currentY += deltaY;
    
    startX = touch.pageX;
    startY = touch.pageY;
    
    updateTransform();
    
    // Track velocity
    const now = Date.now();
    const timeDelta = now - lastMoveTime;
    if (timeDelta > 0) {
        velocityX = (touch.pageX - lastMoveX) / timeDelta;
        velocityY = (touch.pageY - lastMoveY) / timeDelta;
    }
    lastMoveX = touch.pageX;
    lastMoveY = touch.pageY;
    lastMoveTime = now;
}, { passive: false });

container.addEventListener('touchend', () => {
    isDragging = false;
    applyMomentum();
}, { passive: true });

// === WHEEL/TRACKPAD SCROLLING ===

container.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    currentX -= e.deltaX;
    currentY -= e.deltaY;
    
    updateTransform();
}, { passive: false });

// === MOMENTUM SCROLLING ===

function applyMomentum() {
    if (Math.abs(velocityX) < 0.01 && Math.abs(velocityY) < 0.01) {
        return;
    }
    
    currentX += velocityX * 16;
    currentY += velocityY * 16;
    
    updateTransform();
    
    velocityX *= 0.95;
    velocityY *= 0.95;
    
    requestAnimationFrame(applyMomentum);
}

// Prevent text selection
container.addEventListener('selectstart', (e) => {
    if (isDragging) e.preventDefault();
});

// Initialize
createInitialCards();
updateVisibleCards();