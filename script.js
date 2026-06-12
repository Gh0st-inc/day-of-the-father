const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameInitialized = false;

function getScale() {
    return Math.min(1, canvas.width / 600);
}

function getCols() {
    return canvas.width < 500 ? 7 : 11;
}

function getColSpacing() {
    return Math.floor((canvas.width - 40) / getCols());
}

function getRowSpacing() {
    return Math.floor(getColSpacing() * 0.75);
}

function getEmojiSize() {
    return Math.max(18, Math.floor(getColSpacing() * 0.55));
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (gameInitialized) {
        createShields();
    }
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let gameRunning = false;
let score = 0;
let lives = 3;

const livesElement = document.getElementById("lives");
livesElement.textContent = lives;

const scoreElement = document.getElementById("score");
const startBtn     = document.getElementById("startBtn");
const startScreen  = document.getElementById("startScreen");

// =====================
// JUGADOR
// =====================
const player = {
    width: 40,
    height: 25,
    x: 0,
    y: 0,
    speed: 6
};

// =====================
// CONTROLES — pointerdown/pointerup para Android
// =====================
const keys    = {};
const leftBtn  = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const fireBtn  = document.getElementById("fireBtn");

if (leftBtn && rightBtn && fireBtn) {
    leftBtn.addEventListener("pointerdown",  () => { keys["ArrowLeft"]  = true;  });
    leftBtn.addEventListener("pointerup",    () => { keys["ArrowLeft"]  = false; });
    leftBtn.addEventListener("pointerleave", () => { keys["ArrowLeft"]  = false; });

    rightBtn.addEventListener("pointerdown",  () => { keys["ArrowRight"] = true;  });
    rightBtn.addEventListener("pointerup",    () => { keys["ArrowRight"] = false; });
    rightBtn.addEventListener("pointerleave", () => { keys["ArrowRight"] = false; });

    fireBtn.addEventListener("pointerdown", () => { shoot(); });
}

document.addEventListener("keydown", e => {
    keys[e.key] = true;
    if (e.code === "Space") { e.preventDefault(); shoot(); }
});
document.addEventListener("keyup", e => { keys[e.key] = false; });

// =====================
// DISPAROS
// =====================
let bullets      = [];
let enemyBullets = [];

function shoot() {
    if (!gameRunning) return;
    if (bullets.length > 0) return;
    bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 15
    });
}

function enemyShoot() {
    const aliveInvaders = invaders.filter(i => i.alive);
    if (aliveInvaders.length === 0) return;
    const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
    const cs = getColSpacing();
    enemyBullets.push({
        x: formationX + shooter.col * cs + cs * 0.3,
        y: formationY + shooter.row * getRowSpacing() + 20,
        width: 4,
        height: 15
    });
}

// =====================
// INVASORES
// =====================
const rows = 5;
let cols = 11;

let formationX   = 20;
let formationY   = 40;
let direction    = 1;
let lastDropTime = 0;   // timestamp del último bajada

let invaders = [];

function createInvaders() {
    cols = getCols();
    invaders = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            invaders.push({ row, col, alive: true });
        }
    }
}

createInvaders();

// =====================
// ESCUDOS
// =====================
let shields = [];

function createShields() {
    shields = [];
    const numShields = canvas.width < 400 ? 3 : 4;
    const shieldSize = canvas.width < 400 ? 8 : 10;
    const shieldCols = canvas.width < 400 ? 6 : 8;

    for (let i = 0; i < numShields; i++) {
        const startX = canvas.width * (i + 0.5) / numShields - (shieldCols * shieldSize) / 2;
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < shieldCols; x++) {
                shields.push({
                    x: startX + x * shieldSize,
                    y: canvas.height - 200 + y * shieldSize,
                    width: shieldSize,
                    height: shieldSize,
                    alive: true
                });
            }
        }
    }
}

createShields();
gameInitialized = true;

setInterval(() => { if (gameRunning) { enemyShoot(); } }, 1200);

// =====================
// INICIO
// =====================
startBtn.addEventListener("click", () => {
    score = 0;
    lives = 3;
    scoreElement.textContent = score;
    livesElement.textContent = lives;

    bullets      = [];
    enemyBullets = [];
    formationX   = 20;
    formationY   = 40;
    direction    = 1;
    lastDropTime = 0;

    createInvaders();
    createShields();

    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 80;

    startScreen.style.display = "none";
    gameRunning = true;
});

// =====================
// UPDATE
// =====================
function update(timestamp) {
    player.y = canvas.height - 80;

    if (keys["ArrowLeft"])  { player.x -= player.speed; }
    if (keys["ArrowRight"]) { player.x += player.speed; }
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

    bullets.forEach(b => { b.y -= 10; });
    bullets = bullets.filter(b => b.y > -20);

    enemyBullets.forEach(b => { b.y += 4; });
    enemyBullets = enemyBullets.filter(b => b.y < canvas.height + 20);

    // Velocidad según invasores restantes
    const aliveCount = invaders.filter(i => i.alive).length;
    const total = rows * cols;
    let speed = 1;
    if (aliveCount < total * 0.7)  speed = 1.5;
    if (aliveCount < total * 0.4)  speed = 2;
    if (aliveCount < total * 0.15) speed = 3;

    formationX += direction * speed;

    // Borde: solo baja si pasaron al menos 600ms desde la última bajada
    const cs = getColSpacing();
    let hitEdge = false;
    invaders.forEach(invader => {
        if (!invader.alive) return;
        const x = formationX + invader.col * cs;
        if (x + cs > canvas.width - 10 || x < 10) { hitEdge = true; }
    });

    if (hitEdge && timestamp - lastDropTime > 600) {
        direction    *= -1;
        formationY   += 15;
        lastDropTime  = timestamp;
    }

    const rs = getRowSpacing();

    // Bala vs invasor
    bullets.forEach(bullet => {
        invaders.forEach(invader => {
            if (!invader.alive) return;
            const x = formationX + invader.col * cs;
            const y = formationY + invader.row * rs;
            if (
                bullet.x < x + cs - 5 &&
                bullet.x + bullet.width > x + 5 &&
                bullet.y < y + rs - 5 &&
                bullet.y + bullet.height > y
            ) {
                invader.alive = false;
                bullet.dead   = true;
                score += 10;
                scoreElement.textContent = score;
            }
        });
    });

    // Bala vs escudo
    bullets.forEach(bullet => {
        shields.forEach(block => {
            if (!block.alive) return;
            if (
                bullet.x < block.x + block.width &&
                bullet.x + bullet.width > block.x &&
                bullet.y < block.y + block.height &&
                bullet.y + bullet.height > block.y
            ) { block.alive = false; bullet.dead = true; }
        });
    });

    bullets = bullets.filter(b => !b.dead);

    // Bala enemiga vs jugador
    enemyBullets.forEach(bullet => {
        if (
            bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y
        ) {
            bullet.dead = true;
            lives--;
            livesElement.textContent = lives;
            if (lives <= 0) {
                gameRunning = false;
                setTimeout(() => alert("💥 GAME OVER"), 50);
            }
        }
    });

    // Bala enemiga vs escudos
    enemyBullets.forEach(bullet => {
        shields.forEach(block => {
            if (!block.alive) return;
            if (
                bullet.x < block.x + block.width &&
                bullet.x + bullet.width > block.x &&
                bullet.y < block.y + block.height &&
                bullet.y + bullet.height > block.y
            ) { block.alive = false; bullet.dead = true; }
        });
    });

    enemyBullets = enemyBullets.filter(b => !b.dead);

    // Victoria
    if (invaders.filter(i => i.alive).length === 0) {
        gameRunning = false;
        setTimeout(() => alert(
            "🎉 ¡Feliz Día del Padre! 🎉\n\n" +
            "Superaste el sueño,\n" +
            "los gastos y los trámites.\n\n" +
            "🏆 ¡Sos un Super Papá! 🏆"
        ), 50);
    }
}

// =====================
// DIBUJADO
// =====================
function drawPlayer() {
    const size = Math.max(28, Math.floor(40 * getScale()));
    ctx.font      = size + "px Arial";
    ctx.textAlign = "left";
    ctx.fillText("🏆", player.x, player.y + size);
}

function drawBullets() {
    ctx.fillStyle = "#ffffff";
    bullets.forEach(b => { ctx.fillRect(b.x, b.y, b.width, b.height); });
}

function drawEnemyBullets() {
    ctx.fillStyle = "#ff0000";
    enemyBullets.forEach(b => { ctx.fillRect(b.x, b.y, b.width, b.height); });
}

function drawInvaders() {
    const cs   = getColSpacing();
    const rs   = getRowSpacing();
    const size = getEmojiSize();
    ctx.textAlign = "center";
    invaders.forEach(invader => {
        if (!invader.alive) return;
        const x = formationX + invader.col * cs;
        const y = formationY + invader.row * rs;
        let emoji = "📋";
        if (invader.row <= 1)      { emoji = "😴"; }
        else if (invader.row <= 3) { emoji = "💸"; }
        ctx.font = size + "px Arial";
        ctx.fillText(emoji, x + cs / 2, y + size);
    });
}

function drawShields() {
    shields.forEach(block => {
        if (!block.alive) return;
        ctx.fillStyle = "#00cc44";
        ctx.fillRect(block.x, block.y, block.width, block.height);
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawBullets();
    drawEnemyBullets();
    drawInvaders();
    drawShields();
}

// =====================
// LOOP — recibe timestamp de requestAnimationFrame
// =====================
function loop(timestamp) {
    if (gameRunning) { update(timestamp); draw(); }
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
console.log("SCRIPT CARGADO");
