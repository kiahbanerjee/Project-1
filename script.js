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
const MAX_CARDS = 36;
const SPAWN_DISTANCE = 1400;
const CULL_DISTANCE = 1800; 


function getRandomPosition() {
   return {
       x: (Math.random() - 0.5) * 2500,
       y: (Math.random() - 0.5) * 2000,
       z: (Math.random() - 0.5) * 1200  
   };
}


function getRandomScale() {
   return 1;
}


function initCard(card) {
   const id = card.dataset.id;
   const label = card.innerHTML;

   const pos = getRandomPosition();
   const scale = getRandomScale();

   cardRegistry.set(id, {
       pos,
       scale,
       baseLeft: pos.x,
       baseTop: pos.y,
       label
   });

   card.style.position = 'absolute';
   card.style.left = `${pos.x}px`;
   card.style.top = `${pos.y}px`;
   card.style.transform = `translateZ(${pos.z}px) scale(${scale})`;

   return card;
}


function respawnCard(id, x, y, z, label) {
   const card = document.createElement('article');
   card.className = 'card';
   card.dataset.id = id;
   if (label) card.innerHTML = label;


   const pos = { x, y, z };
   const scale = getRandomScale();


   cardRegistry.set(id, {
       pos,
       scale,
       baseLeft: pos.x,
       baseTop: pos.y,
       label
   });


   card.style.position = 'absolute';
   card.style.left = `${pos.x}px`;
   card.style.top = `${pos.y}px`;
   card.style.transform = `translateZ(${pos.z}px) scale(${scale})`;


   grid.appendChild(card);
   return card;
}


function createInitialCards() {
   const cards = grid.querySelectorAll('.card');
   cards.forEach(card => initCard(card));
}


function updateVisibleCards() {
   const centerX = -currentX + window.innerWidth / 2;
   const centerY = -currentY + window.innerHeight / 2;
   const centerZ = -currentZ;

   const cards = Array.from(grid.querySelectorAll('.card'));
   const culledCards = [];

   cards.forEach(card => {
       const id = card.dataset.id;
       const data = cardRegistry.get(id);
       if (!data) return;

       const dx = data.pos.x - centerX;
       const dy = data.pos.y - centerY;
       const dz = data.pos.z - centerZ;
       const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

       if (distance > CULL_DISTANCE) {
           culledCards.push({ id, label: data.label });
           card.remove();
           cardRegistry.delete(id);
       } else {
           const blurAmount = Math.max(0, (distance - 800) / 300);
           card.style.filter = distance > 800 ? `blur(${blurAmount}px)` : 'none';
       }
   });

   culledCards.forEach(({ id, label }) => {
       const angle = Math.random() * Math.PI * 2;
       const distance = SPAWN_DISTANCE * (0.5 + Math.random() * 0.5);
       const elevationAngle = (Math.random() - 0.5) * Math.PI;

       const x = centerX + Math.cos(angle) * distance * Math.cos(elevationAngle);
       const y = centerY + Math.sin(angle) * distance * Math.cos(elevationAngle);
       const z = centerZ + Math.sin(elevationAngle) * distance;

       respawnCard(id, x, y, z, label);
   });
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
       e.preventDefault();
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
       const touch1 = e.touches[0];
       const touch2 = e.touches[1];
       const currentDistance = Math.hypot(
           touch1.pageX - touch2.pageX,
           touch1.pageY - touch2.pageY
       );


       const deltaDistance = currentDistance - lastPinchDistance;

       const zoomSpeed = 25;
       const zDelta = deltaDistance * zoomSpeed;
       currentZ += zDelta;

       // Track Z velocity for momentum after pinch ends
       const now = Date.now();
       const timeDelta = now - lastMoveTime;
       if (timeDelta > 0) {
           velocityZ = (zDelta / timeDelta) * 3;
       }
       lastMoveTime = now;

       lastPinchDistance = currentDistance;
       updateTransform();
   } else if (isDragging && e.touches.length === 1) {
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
   if (isPinching === false && Math.abs(velocityZ) > 0.01) {
       applyMomentum();
   }
}, { passive: true });


// mouse movement
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


container.addEventListener('wheel', (e) => {
   e.preventDefault();
   const moveSpeed = 5;


   if (e.shiftKey) {
       currentZ -= e.deltaY * moveSpeed;
   } else if (e.ctrlKey || e.metaKey) {
       currentZ -= e.deltaY * moveSpeed;
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


// when the card is in focus
const overlay = document.querySelector('.focus-overlay');
let focusedCard = null;
let dragMoved = false;

let focusClone = null;

function openFocusView(card) {
   focusedCard = card;
   focusClone = card.cloneNode(true);
   focusClone.removeAttribute('style');
   focusClone.classList.add('focused');

   // Get the card's current screen position
   const rect = card.getBoundingClientRect();
   const startLeft = rect.left + rect.width / 2;
   const startTop = rect.top + rect.height / 2;

   // Set starting position at the card's actual location
   focusClone.style.left = `${startLeft}px`;
   focusClone.style.top = `${startTop}px`;
   focusClone.style.transform = 'translate(-50%, -50%) scale(1)';

   document.body.appendChild(focusClone);
   overlay.classList.add('active');

   // Animate to center on next frame
   requestAnimationFrame(() => {
       focusClone.style.left = '50%';
       focusClone.style.top = '50%';
       focusClone.style.transform = 'translate(-50%, -50%) scale(2.5)';
   });

   focusClone.addEventListener('click', (e) => {
       const link = e.target.closest('u[data-link]');
       if (link) {
           e.stopPropagation();
           const targetId = link.dataset.link;
           const targetCard = grid.querySelector(`.card[data-id="${targetId}"]`);
           if (targetCard) {
               closeFocusView();
               setTimeout(() => openFocusView(targetCard), 100);
           }
           return;
       }
       closeFocusView();
   });
}

function closeFocusView() {
   if (!focusedCard) return;
   if (focusClone) {
       focusClone.remove();
       focusClone = null;
   }
   overlay.classList.remove('active');
   focusedCard = null;
}

let dragStartPos = { x: 0, y: 0 };
const DRAG_THRESHOLD = 5;

container.addEventListener('mousedown', (e) => {
   dragStartPos = { x: e.pageX, y: e.pageY };
   dragMoved = false;
});

container.addEventListener('mouseup', (e) => {
   const dx = e.pageX - dragStartPos.x;
   const dy = e.pageY - dragStartPos.y;
   if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
       dragMoved = true;
   }
});

container.addEventListener('click', (e) => {
   if (dragMoved) return;
   if (focusedCard) return;
   const card = e.target.closest('.card');
   if (!card) return;
   openFocusView(card);
});

let touchStartPos = { x: 0, y: 0 };
container.addEventListener('touchstart', (e) => {
   if (e.touches.length === 1) {
       touchStartPos = { x: e.touches[0].pageX, y: e.touches[0].pageY };
   }
}, { passive: true });

container.addEventListener('touchend', (e) => {
   if (focusedCard) return;
   const touch = e.changedTouches[0];
   const dx = touch.pageX - touchStartPos.x;
   const dy = touch.pageY - touchStartPos.y;
   if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) {
       const card = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.card');
       if (card) openFocusView(card);
   }
}, { passive: true });

overlay.addEventListener('click', closeFocusView);
overlay.addEventListener('touchend', closeFocusView);

// External link preview
const linkPreview = document.createElement('div');
linkPreview.className = 'link-preview';
document.body.appendChild(linkPreview);

let currentPreviewUrl = null;

document.addEventListener('mouseover', (e) => {
   const ref = e.target.closest('.card.focused .ext-ref');
   if (ref) {
       const url = ref.dataset.url;
       if (url !== currentPreviewUrl) {
           currentPreviewUrl = url;
           linkPreview.innerHTML = '';
           const iframe = document.createElement('iframe');
           iframe.src = url;
           iframe.sandbox = 'allow-same-origin';
           linkPreview.appendChild(iframe);
       }
       linkPreview.classList.add('visible');
   }
});

document.addEventListener('mousemove', (e) => {
   if (linkPreview.classList.contains('visible')) {
       linkPreview.style.left = `${e.clientX + 15}px`;
       linkPreview.style.top = `${e.clientY - 210}px`;
   }
});

document.addEventListener('mouseout', (e) => {
   const ref = e.target.closest('.ext-ref');
   if (ref) {
       linkPreview.classList.remove('visible');
   }
});

document.addEventListener('click', (e) => {
   const ref = e.target.closest('.card.focused .ext-ref');
   if (ref) {
       e.stopPropagation();
       linkPreview.classList.remove('visible');
       currentPreviewUrl = null;
       window.open(ref.dataset.url, '_blank');
   }
});

createInitialCards();
updateVisibleCards();

