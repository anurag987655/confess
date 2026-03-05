const noBtn = document.getElementById('no-btn');
const yesBtn = document.getElementById('yes-btn');
const container = document.querySelector('.container');
const successMsg = document.getElementById('success-msg');

const edgePadding = 16;
const dangerRadius = 90;
let lastPointerX = window.innerWidth / 2;
let lastPointerY = window.innerHeight / 2;
let isFloating = false;

noBtn.tabIndex = -1;

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getBounds() {
    const btnWidth = noBtn.offsetWidth;
    const btnHeight = noBtn.offsetHeight;

    const viewportMaxX = Math.max(0, window.innerWidth - btnWidth);
    const viewportMaxY = Math.max(0, window.innerHeight - btnHeight);

    // Keep padding when there is room; on tiny screens fall back to strict viewport bounds.
    const minX = viewportMaxX >= edgePadding * 2 ? edgePadding : 0;
    const minY = viewportMaxY >= edgePadding * 2 ? edgePadding : 0;
    const maxX = viewportMaxX >= edgePadding * 2 ? viewportMaxX - edgePadding : viewportMaxX;
    const maxY = viewportMaxY >= edgePadding * 2 ? viewportMaxY - edgePadding : viewportMaxY;

    return { minX, minY, maxX, maxY, viewportMaxX, viewportMaxY };
}

function ensureFloatingNoButton() {
    if (isFloating) {
        return;
    }

    const rect = noBtn.getBoundingClientRect();
    document.body.appendChild(noBtn);
    noBtn.style.position = 'fixed';
    noBtn.style.left = `${clamp(rect.left, 0, Math.max(0, window.innerWidth - rect.width))}px`;
    noBtn.style.top = `${clamp(rect.top, 0, Math.max(0, window.innerHeight - rect.height))}px`;
    noBtn.style.zIndex = '9999';
    noBtn.style.margin = '0';
    isFloating = true;
}

function moveNoButton(pointerX = lastPointerX, pointerY = lastPointerY) {
    ensureFloatingNoButton();
    const bounds = getBounds();
    let newX = bounds.minX;
    let newY = bounds.minY;
    let found = false;

    // Try multiple random positions and keep one far from cursor.
    for (let i = 0; i < 40; i += 1) {
        const candidateX = Math.floor(Math.random() * (bounds.maxX - bounds.minX + 1)) + bounds.minX;
        const candidateY = Math.floor(Math.random() * (bounds.maxY - bounds.minY + 1)) + bounds.minY;
        const centerX = candidateX + noBtn.offsetWidth / 2;
        const centerY = candidateY + noBtn.offsetHeight / 2;
        const distance = Math.hypot(pointerX - centerX, pointerY - centerY);

        if (distance > dangerRadius * 1.35) {
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

    newX = clamp(newX, bounds.minX, bounds.maxX);
    newY = clamp(newY, bounds.minY, bounds.maxY);
    newX = clamp(newX, 0, bounds.viewportMaxX);
    newY = clamp(newY, 0, bounds.viewportMaxY);

    noBtn.style.position = 'fixed';
    noBtn.style.left = `${newX}px`;
    noBtn.style.top = `${newY}px`;
    noBtn.style.right = 'auto';
    noBtn.style.bottom = 'auto';
    noBtn.style.zIndex = '9999';
    noBtn.style.transition = 'left 0.08s linear, top 0.08s linear';
}

function maybeEvade(pointerX, pointerY) {
    const rect = noBtn.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
        return;
    }

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(pointerX - centerX, pointerY - centerY);

    if (distance < dangerRadius) {
        moveNoButton(pointerX, pointerY);
    }
}

noBtn.addEventListener('mouseenter', (event) => {
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    moveNoButton(lastPointerX, lastPointerY);
});
noBtn.addEventListener('mousemove', (event) => {
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    maybeEvade(event.clientX, event.clientY);
});
noBtn.addEventListener('touchstart', () => moveNoButton(), { passive: true });

window.addEventListener('mousemove', (event) => {
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    maybeEvade(event.clientX, event.clientY);
});
window.addEventListener('resize', () => {
    if (noBtn.style.position === 'fixed') {
        moveNoButton();
    }
});

noBtn.addEventListener('click', (event) => {
    event.preventDefault();
    moveNoButton(lastPointerX, lastPointerY);
});

yesBtn.addEventListener('click', () => {
    noBtn.style.display = 'none';
    noBtn.style.pointerEvents = 'none';
    container.classList.add('hidden');
    successMsg.classList.remove('hidden');

    triggerConfetti();
});

function triggerConfetti() {
    const colors = ['#ff0054', '#ff4d6d', '#ff758f', '#ff85a1', '#fbb1bd'];

    for (let i = 0; i < 50; i += 1) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.top = '-10px';
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.borderRadius = '50%';
        confetti.style.zIndex = '2000';
        confetti.style.transition = `transform ${Math.random() * 2 + 1}s linear, top ${Math.random() * 2 + 1}s linear`;

        document.body.appendChild(confetti);

        setTimeout(() => {
            confetti.style.top = '110vh';
            confetti.style.transform = `translateX(${Math.random() * 200 - 100}px) rotate(${Math.random() * 360}deg)`;
        }, 10);

        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }
}
