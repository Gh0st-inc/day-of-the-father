const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameInitialized = false;

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
    if (gameInitialized) createShields();
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let gameRunning = false;
let score = 0;
let lives = 3;

const livesElement  = document.getElementById("lives");
const scoreElement  = document.getElementById("score");
const startBtn      = document.getElementById("startBtn");
const startScreen   = document.getElementById("startScreen");
livesElement.textContent = lives;

// =====================
// JUGADOR
// =====================
const player = { width: 40, height: 25, x: 0, y: 0, speed: 6 };

// =====================
// CONTROLES TÁCTILES — directo sobre el canvas
// =====================
const keys = {};

// Zonas táctiles: izquierda = mover izq, centro = disparar, derecha = mover der
canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    for (let t of e.changedTouches) {
        const x = t.clientX;
        const third = canvas.width / 3;
        if (x < third) {
            keys["ArrowLeft"] = true;
        } else if (x > third * 2) {
            keys["ArrowRight"] = true;
        } else {
            shoot();
        }
    }
}, { passive: false });

canvas.addEventListener("touchend", e => {
    e.preventDefault();
    // Revisamos si quedan touches activos
    let hasLeft = false, hasRight = false;
    for (let t of e.touches) {
        const x = t.clientX;
        const third = canvas.width / 3;
        if (x < third)        hasLeft  = true;
        if (x > third * 2)    hasRight = true;
    }
    keys["ArrowLeft"]  = hasLeft;
    keys["ArrowRight"] = hasRight;
}, { passive: false });

canvas.addEventListener("touchcancel", e => {
    keys["ArrowLeft"]  = false;
    keys["ArrowRight"] = false;
}, { passive: false });

// Teclado PC
document.addEventListener("keydown", e => {
    keys[e.key] = true;
    if (e.code === "Space") { e.preventDefault(); shoot(); }
});
document.addEventListener("keyup", e => { keys[e.key] = false; });

// =====================
// DISPAROS
// =====================
let bullets = [], enemyBullets = [];

function shoot() {
    if (!gameRunning) return;
    if (bullets.length > 0) return;
    bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 15 });
}

function enemyShoot() {
    const alive = invaders.filter(i => i.alive);
    if (!alive.length) return;
    const s = alive[Math.floor(Math.random() * alive.length)];
    const cs = getColSpacing();
    enemyBullets.push({
        x: formationX + s.col * cs + cs * 0.3,
        y: formationY + s.row * getRowSpacing() + 20,
        width: 4, height: 15
    });
}

// =====================
// INVASORES
// =====================
const rows = 5;
let cols = 11;
let formationX = 20, formationY = 40, direction = 1, lastDropTime = 0;
let invaders = [];

function createInvaders() {
    cols = getCols();
    invaders = [];
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
            invaders.push({ row: r, col: c, alive: true });
}
createInvaders();

// =====================
// ESCUDOS
// =====================
let shields = [];

function createShields() {
    shields = [];
    const num  = canvas.width < 400 ? 3 : 4;
    const size = canvas.width < 400 ? 8 : 10;
    const scols = canvas.width < 400 ? 6 : 8;
    for (let i = 0; i < num; i++) {
        const sx = canvas.width * (i + 0.5) / num - (scols * size) / 2;
        for (let y = 0; y < 4; y++)
            for (let x = 0; x < scols; x++)
                shields.push({ x: sx + x*size, y: canvas.height-200+y*size, width:size, height:size, alive:true });
    }
}
createShields();
gameInitialized = true;

setInterval(() => { if (gameRunning) enemyShoot(); }, 1200);

// =====================
// INICIO
// =====================
startBtn.addEventListener("click", () => {
    score = 0; lives = 3;
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    bullets = []; enemyBullets = [];
    formationX = 20; formationY = 40; direction = 1; lastDropTime = 0;
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
function update(ts) {
    player.y = canvas.height - 80;
    if (keys["ArrowLeft"])  player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

    bullets.forEach(b => b.y -= 10);
    bullets = bullets.filter(b => b.y > -20);
    enemyBullets.forEach(b => b.y += 4);
    enemyBullets = enemyBullets.filter(b => b.y < canvas.height + 20);

    const alive = invaders.filter(i => i.alive).length;
    const total = rows * cols;
    let spd = alive < total*.15 ? 3 : alive < total*.4 ? 2 : alive < total*.7 ? 1.5 : 1;
    formationX += direction * spd;

    const cs = getColSpacing(), rs = getRowSpacing();
    let hit = false;
    invaders.forEach(inv => {
        if (!inv.alive) return;
        const x = formationX + inv.col * cs;
        if (x + cs > canvas.width - 10 || x < 10) hit = true;
    });
    if (hit && ts - lastDropTime > 600) {
        direction *= -1;
        formationY += 15;
        lastDropTime = ts;
    }

    // Balas vs invasores
    bullets.forEach(b => {
        invaders.forEach(inv => {
            if (!inv.alive) return;
            const x = formationX + inv.col*cs, y = formationY + inv.row*rs;
            if (b.x < x+cs-5 && b.x+b.width > x+5 && b.y < y+rs-5 && b.y+b.height > y) {
                inv.alive = false; b.dead = true;
                score += 10; scoreElement.textContent = score;
            }
        });
    });

    // Balas vs escudos
    bullets.forEach(b => {
        shields.forEach(s => {
            if (!s.alive) return;
            if (b.x < s.x+s.width && b.x+b.width > s.x && b.y < s.y+s.height && b.y+b.height > s.y)
                { s.alive = false; b.dead = true; }
        });
    });
    bullets = bullets.filter(b => !b.dead);

    // Balas enemigas vs jugador
    enemyBullets.forEach(b => {
        if (b.x < player.x+player.width && b.x+b.width > player.x &&
            b.y < player.y+player.height && b.y+b.height > player.y) {
            b.dead = true; lives--;
            livesElement.textContent = lives;
            if (lives <= 0) { gameRunning = false; setTimeout(() => alert("💥 GAME OVER"), 50); }
        }
    });

    // Balas enemigas vs escudos
    enemyBullets.forEach(b => {
        shields.forEach(s => {
            if (!s.alive) return;
            if (b.x < s.x+s.width && b.x+b.width > s.x && b.y < s.y+s.height && b.y+b.height > s.y)
                { s.alive = false; b.dead = true; }
        });
    });
    enemyBullets = enemyBullets.filter(b => !b.dead);

    if (!invaders.some(i => i.alive)) {
        gameRunning = false;
        setTimeout(() => alert("🎉 ¡Feliz Día del Padre! 🎉\n\n🏆 ¡Sos un Super Papá! 🏆"), 50);
    }
}

// =====================
// DIBUJADO
// =====================
function drawTouchZones() {
    if (!gameRunning) return;
    const third = canvas.width / 3;
    const y = canvas.height - 120;
    const h = 110;

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, y, third, h);
    ctx.fillRect(third*2, y, third, h);
    ctx.fillStyle = "#ffff00";
    ctx.fillRect(third, y, third, h);
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("⬅️", third/2, y + 65);
    ctx.fillText("🔥", third*1.5, y + 65);
    ctx.fillText("➡️", third*2.5, y + 65);
}

function drawPlayer() {
    const size = Math.max(28, Math.floor(40 * Math.min(1, canvas.width/600)));
    ctx.font = size + "px Arial";
    ctx.textAlign = "left";
    ctx.fillText("🏆", player.x, player.y + size);
}

function drawBullets() {
    ctx.fillStyle = "#fff";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
}

function drawEnemyBullets() {
    ctx.fillStyle = "#f00";
    enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
}

function drawInvaders() {
    const cs = getColSpacing(), rs = getRowSpacing(), sz = getEmojiSize();
    ctx.textAlign = "center";
    invaders.forEach(inv => {
        if (!inv.alive) return;
        const x = formationX + inv.col*cs, y = formationY + inv.row*rs;
        ctx.font = sz + "px Arial";
        ctx.fillText(inv.row<=1?"😴":inv.row<=3?"💸":"📋", x+cs/2, y+sz);
    });
}

function drawShields() {
    ctx.fillStyle = "#00cc44";
    shields.forEach(s => { if (s.alive) ctx.fillRect(s.x, s.y, s.width, s.height); });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTouchZones();
    drawPlayer();
    drawBullets();
    drawEnemyBullets();
    drawInvaders();
    drawShields();
}

// =====================
// LOOP
// =====================
function loop(ts) {
    if (gameRunning) { update(ts); draw(); }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
console.log("SCRIPT CARGADO");
