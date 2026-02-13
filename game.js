const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const getReadyImg = document.getElementById('getReady');
const gameOverImg = document.getElementById('gameOver');
const scoreDiv = document.getElementById('score');

// Load images
const images = {};
const imageSources = {
    bg: 'bg.png',
    bird0: 'bird_0.png',
    bird1: 'bird_1.png',
    bird2: 'bird_2.png',
    aln: 'aln.png',
    pipe: 'pipe_green.png',
    land: 'land_0.png'
};

// Load sounds
const sounds = {
    alena: new Audio('alena.mp3')
};

const soundTimeouts = {};

function playSound(name, duration) {
    if (sounds[name]) {
        // Clear any existing stop timeout for this sound
        if (soundTimeouts[name]) {
            clearTimeout(soundTimeouts[name]);
        }

        sounds[name].currentTime = 0;
        sounds[name].play().catch(e => console.log("Audio play blocked", e));
        
        if (duration) {
            soundTimeouts[name] = setTimeout(() => {
                sounds[name].pause();
                sounds[name].currentTime = 0;
                delete soundTimeouts[name];
            }, duration * 1000);
        }
    }
}

let imagesLoaded = 0;
const totalImages = Object.keys(imageSources).length;

for (let key in imageSources) {
    images[key] = new Image();
    images[key].src = imageSources[key];
    images[key].onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            init();
        }
    };
}

// Game constants
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 480;
const GRAVITY = 0.25;
const JUMP = -4.5;
const PIPE_SPEED = 2;
const PIPE_SPAWN_RATE = 100; // frames
const PIPE_GAP = 100;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let state = 'GET_READY'; // GET_READY, PLAYING, GAME_OVER
let score = 0;
let frameCount = 0;

let bird = {
    x: 50,
    y: 150,
    velocity: 0,
    width: 50,
    height: 50,
    frame: 0
};

let pipes = [];
let landX = 0;

function init() {
    resetGame();
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    bird.y = 150;
    bird.velocity = 0;
    pipes = [];
    score = 0;
    frameCount = 0;
    state = 'GET_READY';
    getReadyImg.classList.remove('hidden');
    gameOverImg.classList.add('hidden');
    scoreDiv.classList.add('hidden');
    scoreDiv.innerText = '0';
}

function jump() {
    if (state === 'GET_READY') {
        state = 'PLAYING';
        getReadyImg.classList.add('hidden');
        scoreDiv.classList.remove('hidden');
        playSound('swoosh');
    }
    if (state === 'PLAYING') {
        bird.velocity = JUMP;
        playSound('alena', 2.5);
    } else if (state === 'GAME_OVER') {
        resetGame();
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') jump();
});
canvas.addEventListener('mousedown', jump);

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    if (state === 'PLAYING') {
        bird.velocity += GRAVITY;
        bird.y += bird.velocity;

        // Bird animation
        if (frameCount % 5 === 0) {
            bird.frame = (bird.frame + 1) % 3;
        }

        // Spawn pipes
        if (frameCount % PIPE_SPAWN_RATE === 0) {
            const minPipeHeight = 50;
            const maxPipeHeight = CANVAS_HEIGHT - PIPE_GAP - minPipeHeight - 112; // 112 is ground height
            const topPipeHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
            
            pipes.push({
                x: CANVAS_WIDTH,
                topHeight: topPipeHeight,
                width: 52,
                passed: false
            });
        }

        // Update pipes
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= PIPE_SPEED;

            // Collision detection
            if (
                bird.x + bird.width > pipes[i].x &&
                bird.x < pipes[i].x + pipes[i].width &&
                (bird.y < pipes[i].topHeight || bird.y + bird.height > pipes[i].topHeight + PIPE_GAP)
            ) {
                state = 'GAME_OVER';
                playSound('final');
                gameOverImg.classList.remove('hidden');
            }

            // Score
            if (!pipes[i].passed && bird.x > pipes[i].x + pipes[i].width) {
                score++;
                playSound('point');
                pipes[i].passed = true;
                scoreDiv.innerText = score;
            }

            // Remove off-screen pipes
            if (pipes[i].x + pipes[i].width < 0) {
                pipes.splice(i, 1);
            }
        }

        // Ground collision
        if (bird.y + bird.height > CANVAS_HEIGHT - 112) {
            state = 'GAME_OVER';
            playSound('final');
            gameOverImg.classList.remove('hidden');
        }
        
        frameCount++;
    }

    // Move ground
    if (state !== 'GAME_OVER') {
        landX = (landX - PIPE_SPEED) % 336; // 336 is ground width
    }
}

function draw() {
    // Clear
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw BG
    ctx.drawImage(images.bg, 0, CANVAS_HEIGHT - 512);

    // Draw Pipes
    pipes.forEach(p => {
        // Top pipe
        ctx.save();
        ctx.translate(p.x + p.width/2, p.topHeight);
        ctx.rotate(Math.PI);
        ctx.drawImage(images.pipe, -p.width/2, 0, p.width, 320); // 320 is pipe length
        ctx.restore();

        // Bottom pipe
        ctx.drawImage(images.pipe, p.x, p.topHeight + PIPE_GAP, p.width, 320);
    });

    // Draw Ground
    ctx.drawImage(images.land, landX, CANVAS_HEIGHT - 112);
    ctx.drawImage(images.land, landX + 336, CANVAS_HEIGHT - 112);

    // Draw Bird
    const birdImg = images.aln;
    ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
}
