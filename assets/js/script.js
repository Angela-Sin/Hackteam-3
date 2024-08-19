document.addEventListener('DOMContentLoaded', function () {
    // Canvas setup
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 500;

    const scoreBoardDiv = document.createElement('div');
    scoreBoardDiv.id = 'scoreBoard';
    document.body.appendChild(scoreBoardDiv);

    // Game State Variables
    let score = 0;
    let gameStarted = false;
    let selectedDifficulty = 'normal';
    let canDropBomb = true;
    let difficultySelected = false;
    let gameWon = false;
    let isPaused = false;

    // Load sound effects
    const sounds = {
        bombDrop: new Audio('assets/media/sounds/bombDrop.mp3'),
        bombHit: new Audio('assets/media/sounds/bombHit.mp3'),
        bombMiss: new Audio('assets/media/sounds/bombMiss.mp3'),
        levelChange: new Audio('assets/media/sounds/levelChange.mp3'),
        gameOver: new Audio('assets/media/sounds/gameOver.mp3'),
        gameFail: new Audio('assets/media/sounds/gameFail.mp3'),
        gameSuccess: new Audio('assets/media/sounds/gameSuccess.mp3'),
        backgroundMusic: new Audio('assets/media/sounds/backgroundMusic.mp3')
        mainMenu: new Audio('assets/media/sounds/mainMenu.mp3'),
    };

    // Set up font for text rendering
    ctx.font = '50px Pixelify Sans';

    // Difficulty settings
    const difficultySettings = {
        easy: 2,
        normal: 5,
        hard: 7,
    };

    let player;
    let playerSprite;

    // Player class
    class Player {
        constructor() {
            this.reset();
        }

        reset() {
            this.width = 70;
            this.height = 70;
            this.x = this.width / 2;
            this.y = this.height / 2;
            this.speed = difficultySettings[selectedDifficulty];
            this.direction = 1;
            this.verticalStep = this.height / 3;
            this.gameOver = false;
        }

        draw() {
            ctx.drawImage(playerSprite, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }

        update() {
            if (this.gameOver || !gameStarted || isPaused) return;
            this.x += this.speed * this.direction;


            if (this.x + this.width / 2 > canvas.width || this.x - this.width / 2 < 0) {
                this.direction *= -1;
                this.y += this.verticalStep;


                if (this.y + this.height / 2 >= canvas.height) {
                    this.gameOver = true;
                    this.y = canvas.height - this.height / 2;
                    sounds.gameOver.play();
                    sounds.backgroundMusic.pause();
                }
            }
        }
    }


    // Projectile class
    class Projectile {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = 20; // Adjust based on the actual sprite size
            this.height = 20; // Adjust based on the actual sprite size
            this.speed = 5;
            this.active = true;
        }

        draw() {
            ctx.drawImage(projectileSprite,
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height);
        }

        update() {
            this.y += this.speed;
            if (this.y - this.height / 2 > canvas.height) {
                this.active = false;
                sounds.bombMiss.play();
            }
        }

        checkCollision(building) {
            return this.x < building.x + building.width &&
                this.x + this.width > building.x &&
                this.y < building.visibleY + building.visibleHeight &&
                this.y + this.height > building.visibleY;
        }
    }

    // Array to hold projectiles
    const projectiles = [];

    // Buildings setup
    const buildings = [];

    // Building class
    class Building {
        constructor(x, width, health, sprite) {
            this.x = x;
            this.width = width;
            this.health = health;
            this.maxHealth = health;
            this.sprite = sprite;
            this.spriteWidth = 48;
            this.spriteHeight = 202;
            this.scale = this.width / this.spriteWidth;
            this.height = this.spriteHeight * this.scale;
            this.y = canvas.height - this.height;
            this.isDestroyed = false;
            this.visibleHeight = this.calculateVisibleHeight();
            this.visibleY = this.y + (this.height - this.visibleHeight);
        }

        calculateVisibleHeight() {
            const baseVisibleHeight = (() => {
                if (this.sprite === tallBuildingSprite) {
                    return this.height * 0.9; // Base visible height for tall buildings
                } else if (this.sprite === medBuildingSprite) {
                    return this.height * 0.5; // Base visible height for medium buildings
                } else if (this.sprite === smallBuildingSprite) {
                    return this.height * 0.3; // Base visible height for small buildings
                }
            })();

            // Adjust visible height based on remaining health
            return baseVisibleHeight * (this.health / this.maxHealth);
        }

        draw() {
            let spriteX;
            if (this.isDestroyed) {
                // Use the last sprite in the sheet for the destroyed state
                spriteX = (this.maxHealth - 1) * this.spriteWidth;
            } else {
                spriteX = (this.maxHealth - this.health) * this.spriteWidth;
            }

            ctx.drawImage(
                this.sprite,
                spriteX, 0,
                this.spriteWidth, this.spriteHeight,
                this.x, this.y,
                this.width, this.height
            );
        }

        hit() {
            if (!this.isDestroyed) {
                this.health--;
                if (this.health <= 0) {
                    this.health = 0;
                    this.isDestroyed = true;
                }
            }
        }
    }

    function createBuildings() {
        buildings.length = 0;
        let x = 10; // canvasEndGap
        const buildingWidth = 40;
        const buildingGap = 1;

        while (x + buildingWidth <= canvas.width - 10) {
            const health = Math.floor(Math.random() * 3) + 1;

            let sprite;
            if (health === 3) {
                sprite = tallBuildingSprite;
            } else if (health === 2) {
                sprite = medBuildingSprite;
            } else {
                sprite = smallBuildingSprite;
            }

            buildings.push(new Building(x, buildingWidth, health, sprite));
            x += buildingWidth + buildingGap;
        }
    }

    function simulateCollision(building) {
        if (building.health > 0) {
            building.hit();
            score += 10;

            if (building.isDestroyed) {
                const index = buildings.indexOf(building);
                if (index > -1) {
                    buildings.splice(index, 1);
                }

                if (buildings.length === 0) {
                    score += 100;
                    gameWon = true;
                }
                sounds.bombHit.play();
            }
        }
    }

    function drawBuildings() {
        buildings.forEach(building => building.draw());
    }

    function drawProjectiles() {
        projectiles.forEach(projectile => projectile.draw());
    }

    function updateProjectiles() {
        projectiles.forEach((projectile, index) => {
            projectile.update();
            if (!projectile.active) {
                projectiles.splice(index, 1);
            }
        });
    }

    function handleProjectileCollisions() {
        projectiles.forEach((projectile, pIndex) => {
            buildings.forEach((building, bIndex) => {
                if (projectile.checkCollision(building)) {
                    simulateCollision(building);
                    score++;
                    projectiles.splice(pIndex, 1);
                }
            });
        });
    }

    let lastHitBuilding = null;

    function handleCollisions() {
        let collision = false;
        buildings.forEach(building => {
            if (
                player.x + player.width / 2 > building.x &&
                player.x - player.width / 2 < building.x + building.width &&
                player.y + player.height / 2 > building.y &&
                player.y - player.height / 2 < building.y + building.height
            ) {
                if (building !== lastHitBuilding) {
                    simulateCollision(building);
                    score++;
                    lastHitBuilding = building;
                    collision = true;
                }
            }
        });
        if (!collision) {
            lastHitBuilding = null;
        }
    }

    function drawScore() {
        const scoreBoard = document.getElementById('scoreBoard');
        if (scoreBoard) {
            scoreBoard.textContent = 'Score: ' + score;
        }
    }

    function drawDifficultySelection() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'yellow';
        ctx.font = '30px Pixelify Sans';
        ctx.fillText('Select Difficulty', canvas.width / 2 - 150, canvas.height / 2 - 150);
        ctx.fillText('1: Easy', canvas.width / 2 - 50, canvas.height / 2 - 50);
        ctx.fillText('2: Normal', canvas.width / 2 - 50, canvas.height / 2);
        ctx.fillText('3: Hard', canvas.width / 2 - 50, canvas.height / 2 + 50);

        // Play the main menu sound when the difficulty selection screen is shown
        if (!difficultySelected && !sounds.mainMenu.playing) {
            sounds.mainMenu.loop = true; // Loop the main menu music
            sounds.mainMenu.play();
        }
    }

    document.addEventListener('keydown', function (event) {
        if (!gameStarted) {
            // Handle difficulty selection
            if (event.key === '1') {
                selectedDifficulty = 'easy';
                sounds.levelChange.play();
                startGame();
            } else if (event.key === '2') {
                selectedDifficulty = 'normal';
                sounds.levelChange.play();
                startGame();
            } else if (event.key === '3') {
                selectedDifficulty = 'hard';
                sounds.levelChange.play();
                startGame();
            }
        } else {
            // Handle gameplay key events
            if (event.key === ' ' && canDropBomb) {
                dropBomb();
            } else if (event.key === 'Escape') {
                togglePause();
            }
        }
    });

    function dropBomb() {
        if (gameStarted && canDropBomb) {
            projectiles.push(new Projectile(player.x, player.y + player.height / 2));
            sounds.bombDrop.play();
            canDropBomb = false;
        }
    }

    // Then update your event listeners:
    document.addEventListener('keydown', function (event) {
        if (!gameStarted) {
            // ... existing difficulty selection code ...
        } else if (event.key === ' ') {
            dropBomb();
        }
    });

    canvas.addEventListener('mousedown', function (event) {
        dropBomb();
    });

    function checkIfCanDropBomb() {
        if (projectiles.every(p => !p.active)) {
            canDropBomb = true;
        }
    }

    function startGame() {
        gameStarted = true;
        gameWon = false;
        player.reset();
        createBuildings();
        projectiles.length = 0;
        canDropBomb = true;
        isPaused = false;
        // Stop the main menu sound when the game starts
        sounds.mainMenu.pause();
        sounds.mainMenu.currentTime = 0;

        // Play background music when the game starts
        sounds.backgroundMusic.loop = true;
        sounds.backgroundMusic.play();
    }

    function resetGame() {
        gameStarted = false;
        gameWon = false;
        isPaused = false;
        score = 0;
        player.reset();
        projectiles.length = 0;
        buildings.length = 0;
        sounds.backgroundMusic.pause();
        sounds.backgroundMusic.currentTime = 0;
    }

    function togglePause() {
        isPaused = !isPaused;
        if (isPaused) {
            showPauseMenu();
        } else {
            hidePauseMenu();
        }
    }

    function showPauseMenu() {
        document.getElementById('pauseModal').style.display = 'block';
    }

    function hidePauseMenu() {
        document.getElementById('pauseModal').style.display = 'none';
    }

    document.getElementById('resumeButton').addEventListener('click', function () {
        togglePause();
    });

    document.getElementById('quitButton').addEventListener('click', function () {
        resetGame();
        hidePauseMenu();
        drawDifficultySelection();
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && gameStarted) {
            togglePause();
        }
    });

    let colorIndex = 0;
    const colors = ['rgb(255, 255, 0)', 'rgb(128, 0, 128)', 'rgb(255, 165, 0)', 'rgb(255, 255, 255)', 'rgb(255, 0, 0)', 'rgb(0, 0, 0, 0)'];

    function getNextColor() {
        colorIndex = (colorIndex + 1) % colors.length;
        return colors[colorIndex];
    }

    let frameCount = 0;
    let currentColor = colors[colorIndex];

    function animate() {
        if (!gameStarted) {
            drawDifficultySelection();
        } else if (!isPaused) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBuildings();
            drawProjectiles();
            player.update();
            player.draw();
            updateProjectiles();
            handleProjectileCollisions();
            handleCollisions();
            checkIfCanDropBomb();
            drawScore();

            if (gameWon || player.gameOver) {
                frameCount++;
                if (frameCount % 15 === 0) {
                    currentColor = getNextColor();
                }
                ctx.fillStyle = currentColor;
                ctx.font = '60px Pixelify Sans';
                ctx.fillText(gameWon ? 'You Win!' : 'Game Over!', canvas.width / 2 - 150, canvas.height / 2 - 50);

                if (frameCount > 1000) {
                    gameStarted = false;
                    difficultySelected = false;
                    frameCount = 0;
                    colorIndex = 0;
                    currentColor = colors[colorIndex];
                    score = 0;
                }
            }
        }
        requestAnimationFrame(animate);
    }

    function preloadSprites(callback) {
        let loadedCount = 0;
        const totalSprites = 5; // Incremented the count because we're adding a new sprite

        function onLoad() {
            loadedCount++;
            if (loadedCount === totalSprites) {
                player = new Player();
                createBuildings();
                callback();
            }
        }

        playerSprite = new Image();
        playerSprite.onload = onLoad;
        playerSprite.src = 'assets/media/ufo.png';

        tallBuildingSprite = new Image();
        tallBuildingSprite.onload = onLoad;
        tallBuildingSprite.src = 'assets/media/tall_buildingsprite.png';

        medBuildingSprite = new Image();
        medBuildingSprite.onload = onLoad;
        medBuildingSprite.src = 'assets/media/med_buildingsprite.png';

        smallBuildingSprite = new Image();
        smallBuildingSprite.onload = onLoad;
        smallBuildingSprite.src = 'assets/media/small_buildingsprite.png';

        projectileSprite = new Image();
        projectileSprite.onload = onLoad;
        projectileSprite.src = 'assets/media/bomb_sprite.png';
    }

    preloadSprites(() => {
        animate();
    });
});