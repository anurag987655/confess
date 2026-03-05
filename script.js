const noBtn = document.getElementById('no-btn');
const yesBtn = document.getElementById('yes-btn');
const container = document.querySelector('.container');
const stage = document.querySelector('.stage');
const successMsg = document.getElementById('success-msg');
const pleaMsg = document.getElementById('plea-msg');
const bgHearts = document.getElementById('bg-hearts');

const edgePadding = 12;
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const dangerRadius = isTouchDevice ? 110 : 85;

let lastPointerX = window.innerWidth / 2;
let lastPointerY = window.innerHeight / 2;
let isFloating = false;
let noAttempts = 0;
let lastScaleTick = 0;
let lastPleaIndex = -1;
let sparkleCounter = 0;

const floatingElements = ['❤', '💖', '💕', '🌸', '✨', '🌷', '🎀'];
const pleaMessages = [
    '🌸 Just one yes, pretty please? 🌸',
    '🌷 Say yes once, I will keep you smiling 🌷',
    '💐 Tiny yes, huge happiness deal? 💐',
    '🌼 My shy heart picked only you 🌼',
    '🌹 One little yes can make this day magical 🌹',
    '🪷 Say yes and I will cherish you forever 🪷'
];

noBtn.tabIndex = -1;

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getBounds() {
    const btnWidth = noBtn.offsetWidth;
    const btnHeight = noBtn.offsetHeight;
    const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const viewportMaxX = Math.max(0, vw - btnWidth);
    const viewportMaxY = Math.max(0, vh - btnHeight);
    const pad = Math.min(edgePadding, vw * 0.05);
    const minX = viewportMaxX >= pad * 2 ? pad : 0;
    const minY = viewportMaxY >= pad * 2 ? pad : 0;
    const maxX = viewportMaxX >= pad * 2 ? viewportMaxX - pad : viewportMaxX;
    const maxY = viewportMaxY >= pad * 2 ? viewportMaxY - pad : viewportMaxY;
    return { minX, minY, maxX, maxY, viewportMaxX, viewportMaxY, vw, vh };
}

function ensureFloatingNoButton() {
    if (isFloating) return;

    const rect = noBtn.getBoundingClientRect();

    document.body.appendChild(noBtn);
    noBtn.style.position = 'fixed';
    noBtn.style.left = `${rect.left}px`;
    noBtn.style.top = `${rect.top}px`;
    noBtn.style.zIndex = '9999';
    noBtn.style.margin = '0';
    noBtn.style.pointerEvents = 'auto';
    isFloating = true;
}


function moveNoButton(pointerX = lastPointerX, pointerY = lastPointerY) {
    ensureFloatingNoButton();
    const bounds = getBounds();
    let newX = bounds.minX;
    let newY = bounds.minY;
    let found = false;

    for (let i = 0; i < 50; i += 1) {
        const candidateX = Math.floor(Math.random() * (bounds.maxX - bounds.minX + 1)) + bounds.minX;
        const candidateY = Math.floor(Math.random() * (bounds.maxY - bounds.minY + 1)) + bounds.minY;
        const centerX = candidateX + noBtn.offsetWidth / 2;
        const centerY = candidateY + noBtn.offsetHeight / 2;
        const distance = Math.hypot(pointerX - centerX, pointerY - centerY);

        if (distance > dangerRadius * 1.5) {
            newX = candidateX;
            newY = candidateY;
            found = true;
            break;
        }
    }
    if (!found) {
        newX = Math.floor((bounds.minX + bounds.maxX) / 2);
        newY = Math.floor((bounds.minY + bounds.maxY) / 2);
    }
    noBtn.style.left = `${newX}px`;
    noBtn.style.top = `${newY}px`;
    noBtn.style.transition = 'left 0.15s ease-out, top 0.15s ease-out';
}

function createSparkle(x, y) {
    sparkleCounter += 1;
    if (sparkleCounter % 3 !== 0) return;

    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle-trail';
    sparkle.textContent = ['✨', '⭐', '💫', '🌸'][Math.floor(Math.random() * 4)];
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;
    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 800);
}

function applyAttemptScaling() {
    const maxYesScale = isTouchDevice ? 1.6 : 2.0;
    const yesScale = Math.min(1 + noAttempts * 0.15, maxYesScale);
    const noScale = Math.max(1 - noAttempts * 0.1, 0.4);
    yesBtn.style.transform = `scale(${yesScale})`;
    noBtn.style.transform = `scale(${noScale})`;
}

function registerNoAttempt() {
    // Float first so scaling never reflows the centered card layout.
    ensureFloatingNoButton();
    noAttempts += 1;
    applyAttemptScaling();
}

function showPleaMessage() {
    if (!pleaMsg || container.classList.contains('hidden')) return;
    let nextIndex = Math.floor(Math.random() * pleaMessages.length);
    if (pleaMessages.length > 1 && nextIndex === lastPleaIndex) {
        nextIndex = (nextIndex + 1) % pleaMessages.length;
    }
    lastPleaIndex = nextIndex;
    pleaMsg.textContent = pleaMessages[nextIndex];
    pleaMsg.classList.remove('show');
    void pleaMsg.offsetWidth;
    pleaMsg.classList.add('show', 'pleading');
}

if (pleaMsg) pleaMsg.textContent = pleaMessages[0];

function updatePointerAndEvade(pointerX, pointerY) {
    lastPointerX = pointerX;
    lastPointerY = pointerY;
    createSparkle(pointerX, pointerY);
    maybeEvade(pointerX, pointerY);
}

function handleTouchMove(event) {
    if (!event.touches || event.touches.length === 0) return;
    const touch = event.touches[0];
    updatePointerAndEvade(touch.clientX, touch.clientY);
}

function spawnBackgroundElement() {
    if (!bgHearts) return;
    const el = document.createElement('span');
    el.className = 'bg-heart';
    el.textContent = floatingElements[Math.floor(Math.random() * floatingElements.length)];
    el.style.left = `${Math.random() * 100}vw`;
    el.style.fontSize = `${Math.random() * 15 + 12}px`;
    el.style.animationDuration = `${Math.random() * 5 + 7}s`;
    el.style.opacity = `${Math.random() * 0.4 + 0.3}`;
    bgHearts.appendChild(el);
    setTimeout(() => el.remove(), 12000);
}

function maybeEvade(pointerX, pointerY) {
    const rect = noBtn.getBoundingClientRect();
    if (rect.width === 0) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(pointerX - centerX, pointerY - centerY);
    if (distance < dangerRadius) {
        const now = Date.now();
        if (now - lastScaleTick > 100) {
            registerNoAttempt();
            lastScaleTick = now;
        }
        showPleaMessage();
        moveNoButton(pointerX, pointerY);
    }
}

noBtn.addEventListener('mouseenter', (event) => updatePointerAndEvade(event.clientX, event.clientY));
noBtn.addEventListener('mousemove', (event) => updatePointerAndEvade(event.clientX, event.clientY));
noBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    registerNoAttempt();
    showPleaMessage();
    moveNoButton(touch.clientX, touch.clientY);
}, { passive: false });

window.addEventListener('mousemove', (e) => updatePointerAndEvade(e.clientX, e.clientY));
window.addEventListener('touchmove', handleTouchMove, { passive: true });
window.addEventListener('resize', () => { if (isFloating) moveNoButton(); });

setInterval(spawnBackgroundElement, 500);
for (let i = 0; i < 10; i += 1) setTimeout(spawnBackgroundElement, i * 200);

noBtn.addEventListener('click', (e) => { e.preventDefault(); moveNoButton(); });

yesBtn.addEventListener('click', () => {
    noBtn.style.display = 'none';
    container.classList.add('hidden');
    if (pleaMsg) pleaMsg.classList.add('hidden');
    if (stage) stage.classList.add('hidden');
    successMsg.classList.remove('hidden');
    document.body.classList.add('love-mode');
    const bursts = isTouchDevice ? 4 : 6;
    const burstDelay = isTouchDevice ? 420 : 320;
    for (let i = 0; i < bursts; i += 1) setTimeout(triggerConfetti, i * burstDelay);
});

function triggerConfetti() {
    const petals = ['🌸', '🌷', '🌺', '💮', '✨', '💖', '🎀'];
    const count = isTouchDevice ? 16 : 48;
    for (let i = 0; i < count; i += 1) {
        const petal = document.createElement('div');
        petal.className = 'confetti-petal';
        petal.textContent = petals[Math.floor(Math.random() * petals.length)];
        petal.style.left = `${Math.random() * 100}vw`;
        petal.style.fontSize = isTouchDevice ? `${Math.random() * 10 + 16}px` : `${Math.random() * 14 + 16}px`;
        petal.style.setProperty('--drift', `${Math.random() * (isTouchDevice ? 180 : 280) - (isTouchDevice ? 90 : 140)}px`);
        petal.style.setProperty('--twirl', `${Math.random() * 840 - 420}deg`);
        petal.style.setProperty('--fall-duration', isTouchDevice ? `${Math.random() * 1.3 + 2.4}s` : `${Math.random() * 1.8 + 2.8}s`);
        petal.style.animationDelay = `${Math.random() * (isTouchDevice ? 0.16 : 0.25)}s`;
        document.body.appendChild(petal);
        setTimeout(() => petal.remove(), isTouchDevice ? 4200 : 5200);
    }
}
