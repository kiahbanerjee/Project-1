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
const SPAWN_DISTANCE = 1700;
const CULL_DISTANCE = 2300; 


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


function createRandomCard(id, label) {
   const card = document.createElement('article');
   card.className = 'card';
   card.dataset.id = id;
   if (label) card.textContent = label;


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


   grid.appendChild(card);
   return card;
}


function createRandomCardAt(id, x, y, z, label) {
   const card = document.createElement('article');
   card.className = 'card';
   card.dataset.id = id;
   if (label) card.textContent = label;


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


const cardTexts = [
   "The line is made up of an infinite number of points; the plane of an infinite number of lines; the volume of an infinite number of planes; the hypervolume of an infinite number of volumes . . . . No, unquestionably this is not—more geometrico—the best way of beginning my story. To claim that it is true is nowadays the convention of every made-up story. Mine, however, is true.",
   "I live alone in a fourth-floor apartment on Belgrano Street, in Buenos Aires. Late one evening, a few months back, I heard a knock at my door.",
   "I opened it and a stranger stood there. He was a tall man, with nondescript features—or perhaps it was my myopia that made them seem that way. Dressed in gray and carrying a gray suitcase in his hand, he had an unassuming look about him. I saw at once that he was a foreigner. At first, he struck me as old; only later did I realize that I had been misled by his thin blond hair, which was, in a Scandinavian sort of way, almost white. During the course of our conversation, which was not to last an hour, I found out that he came from the Orkneys.",
   "I invited him in, pointing to a chair. He paused awhile before speaking. A kind of gloom emanated from him—as it does now from me.",
   "I sell Bibles,' he said.",
   "Somewhat pedantically, I replied, 'In this house are several English Bibles, including the first—John Wiclif's. I also have Cipriano de Valera's, Luther's—which, from a literary viewpoint, is the worst—and a Latin copy of the Vulgate. As you see, it's not exactly Bibles I stand in need of.",
   "After a few moments of silence, he said, 'I don't only sell Bibles. I can show you a holy book I came across on the outskirts of Bikaner. It may interest you.",
   "He opened the suitcase and lay the book on a table. It was an octavo volume, bound in cloth. There was no doubt that it had passed through many hands. Examining it, I was surprised by its unusual weight. On the spine were the words 'Holy Writ' and, below them, 'Bombay.",
   "Nineteenth-century, probably,' I remarked. 'I don't know,' he said. 'I've never found out",
   "I opened the book at random. The script was strange to me. The pages, which were worn and typographically poor, were laid out in double columns, as in a Bible. The text was closely printed, and it was ordered in versicles. In the upper corners of the pages were Arabic numbers. I noticed that one left-hand page bore the number (let us say) 40,514 and the facing right-hand page 999. I turned the leaf; it was numbered with eight digits.",
   "It also bore a small illustration, like the kind used in dictionaries—an anchor drawn with pen and ink, as if by a schoolboy's clumsy hand. It was at this point that the stranger said, 'Look at the illustration closely. You'll never see it again.' I noted my place and closed the book. At once, I reopened it. Page by page, in vain, I looked for the illustration of the anchor",
   "'It seems to be a version of Scriptures in some Indian language, is it not?' I said to hide my dismay. 'No,' he replied. Then, as if confiding a secret, he lowered his voice. 'I acquired the book in a town out on the plain in exchange for a handful of rupees and a Bible. Its owner did not know how to read. I suspect that he saw the Book of Books as a talisman. He was of the lowest caste; nobody but other untouchables could tread his shadow without contamination. He told me his book was called the Book of Sand, because neither the book nor the sand has any beginning or end.'",
   "The stranger asked me to find the first page. I lay my left hand on the cover and, trying to put my thumb on the flyleaf, I opened the book. It was useless. Every time I tried, a number of pages came between the cover and my thumb. It was as if they kept growing from the book. 'Now find the last page.' Again I failed. In a voice that was not mine, I barely managed to stammer, 'This can't be.'",
   "Still speaking in a low voice, the stranger said, 'It can't be, but it is. The number of pages in this book is no more or less than infinite. None is the first page, none the last. I don't know why they're numbered in this arbitrary way. Perhaps to suggest that the terms of an infinite series admit any number.'",
   "Then, as if he were thinking aloud, he said, 'If space is infinite, we may be at any point in space. If time is infinite, we may be at any point in time.'",
   "His speculations irritated me. 'You are religious, no doubt?' I asked him. 'Yes, I'm a Presbyterian. My conscience is clear. I am reasonably sure of not having cheated the native when I gave him the Word of God in exchange for his devilish book.'",
   "I assured him that he had nothing to reproach himself for, and I asked if he were just passing through this part of the world. He replied that he planned to return to his country in a few days. It was then that I learned that he was a Scot from the Orkney Islands. I told him I had a great personal affection for Scotland, through my love of Stevenson and Hume. 'You mean Stevenson and Robbie Burns,' he corrected.",
   "While we spoke, I kept exploring the infinite book. With feigned indifference, I asked, 'Do you intend to offer this curiosity to the British Museum?' 'No. I'm offering it to you,' he said, and he stipulated a rather high sum for the book.",
   "I answered, in all truthfulness, that such a sum was out of my reach, and I began thinking. After a minute or two, I came up with a scheme. 'I propose a swap,' I said. 'You got this book for a handful of rupees and a copy of the Bible. I'll offer you the amount of my pension check, which I've just collected, and my black-letter Wiclif Bible. I inherited it from my ancestors.'",
   "A black-letter Wiclif!' he murmured. I went to my bedroom and brought him the money and the book. He turned the leaves and studied the title page with all the fervor of a true bibliophile. 'It's a deal,' he said. It amazed me that he did not haggle. Only later was I to realize that he had entered my house with his mind made up to sell the book.",
   "We talked about India, about Orkney, and about the Norwegian jarls who once ruled it. It was night when the man left. I have not seen him again, nor do I know his name.",
   "I thought of keeping the Book of Sand in the space left on the shelf by the Wiclif, but in the end I decided to hide it behind the volumes of a broken set of The Thousand and One Nights.",
   "I went to bed and did not sleep. At three or four in the morning, I turned on the light. I got down the impossible book and leafed through its pages. On one of them I saw engraved a mask. The upper corner of the page carried a number, which I no longer recall, elevated to the ninth power.",
   "I showed no one my treasure. To the luck of owning it was added the fear of having it stolen, and then the misgiving that it might not truly be infinite.",
   "These twin preoccupations intensified my old misanthropy. I had only a few friends left; I now stopped seeing even them. A prisoner of the book, I almost never went out anymore.",
   "After studying its frayed spine and covers with a magnifying glass, I rejected the possibility of a contrivance of any sort.",
   "The small illustrations, I verified, came two thousand pages apart. I set about listing them alphabetically in a notebook, which I was not long in filling up. Never once was an illustration repeated.",
   "At night, in the meagre intervals my insomnia granted, I dreamed of the book.",
   "Summer came and went, and I realized that the book was monstrous.",
   "What good did it do me to think that I, who looked upon the volume with my eyes, who held it in my hands, was any less monstrous?",
   "I felt that the book was a nightmarish object, an obscene thing that affronted and tainted reality itself.",
   "I thought of fire, but I feared that the burning of an infinite book might likewise prove infinite and suffocate the planet with smoke.",
   "Somewhere I recalled reading that the best place to hide a leaf is in a forest.",
   "Before retirement, I worked on Mexico Street, at the Argentine National Library, which contains nine hundred thousand volumes.",
   "I knew that to the right of the entrance a curved staircase leads down into the basement, where books and maps and periodicals are kept.",
   "One day I went there and, slipping past a member of the staff and trying not to notice at what height or distance from the door, I lost the Book of Sand on one of the basement's musty shelves.",
];

function createInitialCards() {
   for (let i = 0; i < MAX_CARDS; i++) {
       createRandomCard(`card-${i}`, cardTexts[i]);
   }
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
           const blurAmount = Math.max(0, (dz / 700) * 2);
           card.style.filter = `blur(${blurAmount}px)`;
       }
   });

   // Respawn culled cards nearby with their original labels
   culledCards.forEach(({ id, label }) => {
       const angle = Math.random() * Math.PI * 2;
       const distance = SPAWN_DISTANCE * (0.5 + Math.random() * 0.5);
       const elevationAngle = (Math.random() - 0.5) * Math.PI;

       const x = centerX + Math.cos(angle) * distance * Math.cos(elevationAngle);
       const y = centerY + Math.sin(angle) * distance * Math.cos(elevationAngle);
       const z = centerZ + Math.sin(elevationAngle) * distance;

       createRandomCardAt(id, x, y, z, label);
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
       // PINCH START
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
       // PINCH ZOOM 
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
   // Apply zoom momentum after pinch ends
   if (isPinching === false && Math.abs(velocityZ) > 0.01) {
       applyMomentum();
   }
}, { passive: true });


// Mouse 
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


// Focus mode
const overlay = document.querySelector('.focus-overlay');
let focusedCard = null;
let dragMoved = false;

let focusClone = null;

function openFocusView(card) {
   focusedCard = card;
   focusClone = card.cloneNode(true);
   // Clear inline styles so CSS class takes over
   focusClone.removeAttribute('style');
   focusClone.classList.add('focused');
   document.body.appendChild(focusClone);
   overlay.classList.add('active');
   // Trigger animation on next frame
   requestAnimationFrame(() => {
       focusClone.classList.add('visible');
   });

   focusClone.addEventListener('click', closeFocusView);
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

// Touch tap support
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

createInitialCards();
updateVisibleCards();

