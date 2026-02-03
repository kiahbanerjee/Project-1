const container = document.querySelector('.library-container');
const grid = document.querySelector('.library-grid');

let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let currentZ = 0;
let zoomScale = 1;
let initialPinchDistance = 0;
let lastPinchDistance = 0;
let isPinching = false;

let velocityX = 0;
let velocityY = 0;
let velocityZ = 0;
let lastMoveTime = 0;
let lastMoveX = 0;
let lastMoveY = 0;

const cardRegistry = new Map();
const MAX_CARDS = 150;

function getRandomPosition() {
    return {
        x: (Math.random() - 0.5) * 8000,
        y: (Math.random() - 0.5) * 6000,
        z: (Math.random() - 0.5) * 4000
    };
}

function getRandomScale() {
    return 0.6 + Math.random() * 0.8;
}

function createRandomCard(id) {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.id = id;

    const pos = getRandomPosition();
    const scale = getRandomScale();

    cardRegistry.set(id, {
        pos,
        scale,
        baseLeft: pos.x,
        baseTop: pos.y
    });

    card.style.position = 'absolute';
    card.style.left = `${pos.x}px`;
    card.style.top = `${pos.y}px`;
    card.style.transform = `translateZ(${pos.z}px) scale(${scale})`;

    grid.appendChild(card);
    return card;
}

function createInitialCards() {
    for (let i = 0; i < MAX_CARDS; i++) {
        createRandomCard(`card-${i}`);
    }
}

function updateVisibleCards() {
    const centerX = currentX + window.innerWidth / 2;
    const centerY = currentY + window.innerHeight / 2;
    const centerZ = currentZ;

    const cards = Array.from(grid.querySelectorAll('.card'));
    const distanceThreshold = 3000 * zoomScale;

    cards.forEach(card => {
        const id = card.dataset.id;
        const data = cardRegistry.get(id);
        if (!data) return;

        const dx = data.pos.x - centerX;
        const dy = data.pos.y - centerY;
        const dz = data.pos.z - centerZ;
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

        if (distance > distanceThreshold) {
            card.remove();
            cardRegistry.delete(id);
        }
    });

    const missingCards = MAX_CARDS - cardRegistry.size;
    for (let i = 0; i < missingCards; i++) {
        const newId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        createRandomCard(newId);
    }
}

function updateTransform() {
    grid.style.transform = `
        translateX(${currentX}px) 
        translateY(${currentY}px) 
        translateZ(${currentZ}px) 
        scale(${zoomScale})
    `;
    updateVisibleCards();
}

container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        // PINCH START
        e.preventDefault(); // Prevent default here
        isPinching = true;
        isDragging = false;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialPinchDistance = Math.hypot(
            touch1.pageX - touch2.pageX,
            touch1.pageY - touch2.pageY
        );
        lastPinchDistance = initialPinchDistance;
    } else if (e.touches.length === 1) {
        // DRAG START
        isDragging = true;
        isPinching = false;
        const touch = e.touches[0];
        startX = touch.pageX;
        startY = touch.pageY;
        lastMoveX = touch.pageX;
        lastMoveY = touch.pageY;
        lastMoveTime = Date.now();
        velocityX = velocityY = velocityZ = 0;
    }
}, { passive: false });

container.addEventListener('touchmove', (e) => {
    e.preventDefault();

    if (e.touches.length === 2 && isPinching) {
        // PINCH ZOOM - FIXED
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
            touch1.pageX - touch2.pageX,
            touch1.pageY - touch2.pageY
        );

        // Calculate scale change based on distance ratio
        const scaleChange = currentDistance / lastPinchDistance;
        zoomScale *= scaleChange;
        zoomScale = Math.max(0.1, Math.min(zoomScale, 3));

        lastPinchDistance = currentDistance;
        updateTransform();
    } else if (isDragging && e.touches.length === 1) {
        // DRAG PAN
        const touch = e.touches[0];
        const deltaX = touch.pageX - startX;
        const deltaY = touch.pageY - startY;
        currentX += deltaX;
        currentY += deltaY;
        startX = touch.pageX;
        startY = touch.pageY;

        const now = Date.now();
        const timeDelta = now - lastMoveTime;
        if (timeDelta > 0) {
            velocityX = (touch.pageX - lastMoveX) / timeDelta;
            velocityY = (touch.pageY - lastMoveY) / timeDelta;
        }
        lastMoveX = touch.pageX;
        lastMoveY = touch.pageY;
        lastMoveTime = now;

        updateTransform();
    }
}, { passive: false });

container.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
        isPinching = false;
    }
    if (e.touches.length === 0) {
        isDragging = false;
        applyMomentum();
    }
}, { passive: true });

// Mouse events
container.addEventListener('mousedown', (e) => {
    isDragging = true;
    container.classList.add('dragging');
    startX = e.pageX;
    startY = e.pageY;
    velocityX = velocityY = velocityZ = 0;
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

// Wheel controls
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const moveSpeed = 2;

    if (e.shiftKey) {
        currentZ += e.deltaY * moveSpeed;
    } else {
        currentX -= e.deltaX * moveSpeed;
        currentY -= e.deltaY * moveSpeed;
    }

    updateTransform();
}, { passive: false });

function applyMomentum() {
    if (Math.abs(velocityX) < 0.01 && Math.abs(velocityY) < 0.01 && Math.abs(velocityZ) < 0.01) {
        return;
    }
    currentX += velocityX * 16;
    currentY += velocityY * 16;
    currentZ += velocityZ * 16;
    updateTransform();
    velocityX *= 0.95;
    velocityY *= 0.95;
    velocityZ *= 0.95;
    requestAnimationFrame(applyMomentum);
}

container.addEventListener('selectstart', (e) => {
    if (isDragging) e.preventDefault();
});

// Initialize
createInitialCards();
updateVisibleCards();