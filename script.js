const container = document.querySelector('.library-container');
const grid = document.querySelector('.library-grid');

// where we are when we drag
let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;

// the speed in which the sroll happens
let velocityX = 0;
let velocityY = 0;
let lastMoveTime = 0;
let lastMoveX = 0;
let lastMoveY = 0;

// Grid details
const CARD_WIDTH = 200;  
const CARD_HEIGHT = 250; 
const GRID_CELL_SIZE = 300; 

// Track which cards exist at which grid positions
const cardPositions = new Set();
const cardLocations = new Map(); // Store actual x,y positions

// Random offset within a grid cell
function getRandomOffset() {
    return Math.random() * 100 - 50; 
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
    if (cardPositions.has(key)) return;
    
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.row = row;
    card.dataset.col = col;
    
   //color of the cards - can i put this in css?
    card.style.background = '#dda272ff';
    
    // Calculate base position with random offset
    const baseX = col * GRID_CELL_SIZE;
    const baseY = row * GRID_CELL_SIZE;
    const x = baseX + getRandomOffset();
    const y = baseY + getRandomOffset();
    
    // Store the actual position
    cardLocations.set(key, { x, y });
    
    // Position the card
    //marks the grid as occupied
    card.style.position = 'absolute';
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
    
    grid.appendChild(card);
    cardPositions.add(key);
}

// creates more cards if needed
function updateVisibleCards() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // the math to figure out which grid is visible on the screen
    const buffer = 2;
    
    const minCol = Math.floor((-currentX - viewportWidth) / GRID_CELL_SIZE) - buffer;
    const maxCol = Math.ceil((-currentX + viewportWidth) / GRID_CELL_SIZE) + buffer;
    const minRow = Math.floor((-currentY - viewportHeight) / GRID_CELL_SIZE) - buffer;
    const maxRow = Math.ceil((-currentY + viewportHeight) / GRID_CELL_SIZE) + buffer;
    
    
    for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
            createCardAt(row, col);
        }
    }
    
    // optional - itll remove cards that are too far away
    removeDistantCards(minRow, maxRow, minCol, maxCol);
}

// Remove cards that are far 
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

// moves the grid
function updateTransform() {
    grid.style.transform = `translateX(${currentX}px) translateY(${currentY}px)`;
    updateVisibleCards();
}

//mouse - click and drag

container.addEventListener('mousedown', (e) => {
    isDragging = true;
    container.classList.add('dragging'); // here or css?
    
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

// mouse - swpiping

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
    
    // speed
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

// trackpad

container.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    currentX -= e.deltaX;
    currentY -= e.deltaY;
    
    updateTransform();
}, { passive: false });

//momentum

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

// makes sure theres no highlighting when dragging
container.addEventListener('selectstart', (e) => {
    if (isDragging) e.preventDefault();
});

// Initialize
createInitialCards();
updateVisibleCards();