const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let gameRunning = false;
let score = 0;
let lives = 3;

const livesElement =
document.getElementById("lives");

livesElement.textContent = lives;

const scoreElement = document.getElementById("score");
const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");

// =====================
// JUGADOR
// =====================

const player = {
    width: 50,
    height: 25,
    x: 0,
    y: 0,
    speed: 7
};

player.x = canvas.width / 2 - player.width / 2;
player.y = canvas.height - 80;

// =====================
// CONTROLES
// =====================

const keys = {};
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const fireBtn = document.getElementById("fireBtn");

if (leftBtn && rightBtn && fireBtn) {

    leftBtn.addEventListener("touchstart", () => {
        keys["ArrowLeft"] = true;
    });

    leftBtn.addEventListener("touchend", () => {
        keys["ArrowLeft"] = false;
    });

    rightBtn.addEventListener("touchstart", () => {
        keys["ArrowRight"] = true;
    });

    rightBtn.addEventListener("touchend", () => {
        keys["ArrowRight"] = false;
    });

    fireBtn.addEventListener("touchstart", () => {
        shoot();
    });

}
document.addEventListener("keydown", e => {

    keys[e.key] = true;

    if (e.code === "Space") {
        shoot();
    }

});

document.addEventListener("keyup", e => {

    keys[e.key] = false;

});

// =====================
// DISPAROS
// =====================

let bullets = [];
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

    const aliveInvaders =
        invaders.filter(i => i.alive);

    if(aliveInvaders.length === 0) return;

    const shooter =
        aliveInvaders[
            Math.floor(
                Math.random() *
                aliveInvaders.length
            )
        ];

    enemyBullets.push({

        x:
        formationX +
        shooter.col * 50 +
        15,

        y:
        formationY +
        shooter.row * 40 +
        20,

        width:4,
        height:15

    });

}

// =====================
// INVASORES
// =====================

const rows = 5;
const cols = 11;

let formationX = 100;
let formationY = 80;
let direction = 1;

let invaders = [];

function createInvaders() {

    invaders = [];

    for (let row = 0; row < rows; row++) {

        for (let col = 0; col < cols; col++) {

            invaders.push({
                row,
                col,
                alive: true
            });

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

    const positions = [
        canvas.width * 0.15,
        canvas.width * 0.35,
        canvas.width * 0.55,
        canvas.width * 0.75
    ];

    positions.forEach(startX => {

        for (let y = 0; y < 5; y++) {

            for (let x = 0; x < 8; x++) {

                shields.push({
                    x: startX + x * 10,
                    y: canvas.height - 180 + y * 10,
                    width: 10,
                    height: 10,
                    alive: true
                });

            }

        }

    });

}

createShields();
setInterval(() => {

    if(gameRunning){

        enemyShoot();

    }

}, 1200);

// =====================
// INICIO
// =====================

startBtn.addEventListener("click", () => {

    startScreen.style.display = "none";
    gameRunning = true;

});

// =====================
// UPDATE
// =====================

function update() {

    player.y = canvas.height - 80;

    if (keys["ArrowLeft"]) {
        player.x -= player.speed;
    }

    if (keys["ArrowRight"]) {
        player.x += player.speed;
    }

    player.x = Math.max(
        0,
        Math.min(canvas.width - player.width, player.x)
    );

    bullets.forEach(b => {
        b.y -= 10;
    });

    bullets = bullets.filter(b => b.y > -20);
    enemyBullets.forEach(b => {
    b.y += 4;
});

enemyBullets = enemyBullets.filter(
    b => b.y < canvas.height + 20
);

    // Movimiento invasores

    let speed = 1;

    const aliveCount =
        invaders.filter(i => i.alive).length;

    if (aliveCount < 40) speed = 1.5;
    if (aliveCount < 25) speed = 2;
    if (aliveCount < 10) speed = 3;

    formationX += direction * speed;

    let hitEdge = false;

    invaders.forEach(invader => {

        if (!invader.alive) return;

        const x = formationX + invader.col * 50;

        if (x > canvas.width - 60 || x < 10) {
            hitEdge = true;
        }

    });

    if (hitEdge) {

        direction *= -1;
        formationY += 20;

    }

    // Bala vs invasor

    bullets.forEach(bullet => {

        invaders.forEach(invader => {

            if (!invader.alive) return;

            const x =
                formationX + invader.col * 50;

            const y =
                formationY + invader.row * 40;

            if (
                bullet.x < x + 30 &&
                bullet.x + bullet.width > x &&
                bullet.y < y + 20 &&
                bullet.y + bullet.height > y
            ) {

                invader.alive = false;
                bullet.dead = true;

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
            ) {

                block.alive = false;
                bullet.dead = true;

            }

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
            alert("💥 GAME OVER");

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
        ) {

            block.alive = false;
            bullet.dead = true;

        }

    });

});

enemyBullets = enemyBullets.filter(
    b => !b.dead
);

    const remaining =
        invaders.filter(i => i.alive).length;

   if (remaining === 0) {

    gameRunning = false;

    alert(
        "🎉 ¡Feliz Día del Padre! 🎉\n\n" +
        "Superaste el sueño,\n" +
        "los gastos y los trámites.\n\n" +
        "🏆 ¡Sos un Super Papá! 🏆"
    );

}
    const lowestInvader = Math.max(
    ...invaders
        .filter(i => i.alive)
        .map(i => formationY + i.row * 40)
);

if (lowestInvader > player.y + 50) {

    gameRunning = false;

    alert("💥 Los invasores invadieron la Tierra");

}

}

// =====================
// DIBUJADO
// =====================
function drawPlayer() {

    ctx.font = "42px Arial";

    ctx.fillText(
        "🏆",
        player.x,
        player.y + 35
    );

}

function drawBullets() {

    ctx.fillStyle = "#ffffff";

    bullets.forEach(b => {

        ctx.fillRect(
            b.x,
            b.y,
            b.width,
            b.height
        );

    });

}
function drawEnemyBullets() {

    ctx.fillStyle = "#ff0000";

    enemyBullets.forEach(b => {

        ctx.fillRect(
            b.x,
            b.y,
            b.width,
            b.height
        );

    });

}
function drawSprite(sprite, x, y, pixelSize) {

    for (let row = 0; row < sprite.length; row++) {

        for (let col = 0; col < sprite[row].length; col++) {

            if (sprite[row][col] === 1) {

                ctx.fillRect(
                    x + col * pixelSize,
                    y + row * pixelSize,
                    pixelSize,
                    pixelSize
                );

            }

        }

    }

}
const invaderSprite = [

[0,0,1,0,0,0,1,0,0],
[0,0,0,1,0,1,0,0,0],
[0,0,1,1,1,1,1,0,0],
[0,1,1,0,1,0,1,1,0],
[1,1,1,1,1,1,1,1,1],
[1,0,1,1,1,1,1,0,1],
[1,0,1,0,0,0,1,0,1],
[0,0,0,1,1,1,0,0,0]

];
function drawInvaders() {

    ctx.textAlign = "center";

    invaders.forEach(invader => {

        if (!invader.alive) return;

        const x =
            formationX + invader.col * 50;

        const y =
            formationY + invader.row * 40;

        let emoji = "📋";

        if (invader.row <= 1) {
            emoji = "😴";
        }
        else if (invader.row <= 3) {
            emoji = "💸";
        }

        ctx.font = "28px Arial";
        ctx.fillText(
            emoji,
            x + 15,
            y + 25
        );

    });

}

function drawShields() {

    ctx.font = "12px Arial";

    shields.forEach(block => {

        if (!block.alive) return;

        ctx.fillText(
            "🧱",
            block.x,
            block.y + 10
        );

    });

}
function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

 drawPlayer();
drawBullets();
drawEnemyBullets();
drawInvaders();
drawShields();
}

// =====================
// LOOP
// =====================

function loop() {

    if (gameRunning) {

        update();
        draw();

    }

    requestAnimationFrame(loop);

}

loop();
