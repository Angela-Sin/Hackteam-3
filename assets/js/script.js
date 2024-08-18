document.addEventListener('DOMContentLoaded', function () {
    // Canvas setup
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 500;

    // Game State Variables
    let score = 0;
    let gameStarted = false;
    let selectedDifficulty = 'normal'; // Default difficulty
    let canDropBomb = true;
    let isPaused = false; // Track if the game is paused

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

            // Change direction and move down when reaching canvas boundaries
            if (this.x + this.width / 2 > canvas.width || this.x - this.width / 2 < 0) {
                this.direction *= -1; // Reverse direction
                this.y += this.verticalStep; // Move down

                // Stop the game if any part of the sprite touches the bottom
                if (this.y + this.height / 2 >= canvas.height) {
                    this.gameOver = true;
                    this.y = canvas.height - this.height / 2;
                    sounds.gameOver.play(); // Play game over sound
                    sounds.backgroundMusic.pause(); // Stop background music
                }
            }
        }
    }

    // Projectile class
    class Projectile {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 10;
            this.speed = 5;
            this.active = true;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'red';
            ctx.fill();
            ctx.closePath();
        }

        update() {
            this.y += this.speed;
            if (this.y - this.radius > canvas.height) {
                this.active = false;
                sounds.bombMiss.play(); // Play bomb miss sound
            }
        }

        checkCollision(building) {
            const dx = this.x - (building.x + building.width / 2);
            const dy = this.y - (building.y + building.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            return distance < this.radius + Math.min(building.width, building.height) / 2;
        }
    }

    // Array to hold projectiles
    const projectiles = [];

    // Buildings setup
    const minHeight = 20;
    const buildingWidth = 20;
    const maxBuildingHeight = 150;
    const buildingGap = 3;
    const canvasEndGap = 10;
    const buildings = [];

    class Building {
        constructor(x, width, health, sprite) {
            this.x = x;
            this.width = width;
            this.health = health;
            this.maxHealth = health;
            this.sprite = sprite;  // Pass the correct sprite when creating the building
            this.spriteWidth = 48;
            this.spriteHeight = 202;
            this.scale = this.width / this.spriteWidth;
            this.height = this.spriteHeight * this.scale;
            this.y = canvas.height - this.height;
            this.isDestroyed = false; // Flag to track if the building is destroyed
        }
    
        draw() {
            let spriteX;
            if (this.isDestroyed) {
                spriteX = (this.maxHealth) * this.spriteWidth;
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
                    this.health = 0; // Ensure health doesn't go below zero
                    this.isDestroyed = true; // Mark as destroyed
                }
            }
        }
    }
    function createBuildings() {
        buildings.length = 0;
        let x = canvasEndGap;
        const buildingWidth = 40;
        const buildingGap = 1;
    
        while (x + buildingWidth <= canvas.width - canvasEndGap) {
            const health = Math.floor(Math.random() * 3) + 1;
    
            // Assign the sprite based on the health or other criteria
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

    // Simulate a hit on collision
    function simulateCollision(building) {
        if (building.health > 0) {
            building.hit(); // Decrease health
            if (building.isDestroyed()) { // Remove only if health is zero
                const index = buildings.indexOf(building);
                if (index > -1) {
                    buildings.splice(index, 1);
                }
                sounds.bombHit.play(); // Play bomb hit sound
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
        projectiles.forEach(projectile => {
            projectile.update();
            if (!projectile.active) {
                const index = projectiles.indexOf(projectile);
                if (index > -1) projectiles.splice(index, 1);
            }
        });
    }

    function handleProjectileCollisions() {
        projectiles.forEach(projectile => {
            buildings.forEach(building => {
                if (projectile.checkCollision(building)) {
                    simulateCollision(building);
                    score++;
                    projectile.active = false; // Deactivate projectile
                }
            });
        });
    }

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

    // Draw the difficulty selection screen
    function drawDifficultySelection() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'yellow';
        ctx.font = '30px Pixelify Sans';
        ctx.fillText('Select Difficulty', canvas.width / 2 - 150, canvas.height / 2 - 150);
        ctx.fillText('1: Easy', canvas.width / 2 - 50, canvas.height / 2 - 50);
        ctx.fillText('2: Normal', canvas.width / 2 - 50, canvas.height / 2);
        ctx.fillText('3: Hard', canvas.width / 2 - 50, canvas.height / 2 + 50);
    }

    // Event listener for difficulty selection
    document.addEventListener('keydown', function (event) {
        if (!gameStarted) {
            if (event.key === '1') {
                selectedDifficulty = 'easy';
                sounds.levelChange.play(); // Play level change sound
                startGame();
            } else if (event.key === '2') {
                selectedDifficulty = 'normal';
                sounds.levelChange.play(); // Play level change sound
                startGame();
            } else if (event.key === '3') {
                selectedDifficulty = 'hard';
                sounds.levelChange.play(); // Play level change sound
                startGame();
            }
        }
    });

    // Event listeners for mouse input
    canvas.addEventListener('mousedown', function (event) {
        if (gameStarted && canDropBomb) {
            projectiles.push(new Projectile(player.x, player.y + player.height / 2));
            sounds.bombDrop.play(); // Play bomb drop sound
            canDropBomb = false;
        }
    });

    // Allow dropping another bomb when the previous one lands
    function checkIfCanDropBomb() {
        if (projectiles.every(p => !p.active)) {
            canDropBomb = true;
        }
    }

    // Start the game
    function startGame() {
        gameStarted = true;
        player.reset();
        createBuildings();
        projectiles.length = 0;
        canDropBomb = true;
        isPaused = false; // Ensure the game is not paused when starting
        sounds.backgroundMusic.loop = true; // Loop background music
        sounds.backgroundMusic.play(); // Start background music
    }

    // Function to toggle pause state and show/hide modal
    function togglePause() {
        isPaused = !isPaused;
        if (isPaused) {
            showPauseMenu();
        } else {
            hidePauseMenu();
        }
    }

    // Show and hide the modal
    function showPauseMenu() {
        document.getElementById('pauseModal').style.display = 'block';
    }

    function hidePauseMenu() {
        document.getElementById('pauseModal').style.display = 'none';
    }

    // Resume the game
    document.getElementById('resumeButton').addEventListener('click', function() {
        togglePause();
    });

    // Quit the game
    document.getElementById('quitButton').addEventListener('click', function() {
        window.location.href = "mainmenu.html"; // Redirect to a main menu or another page
    });

    // Listen for the Escape key to toggle pause
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && gameStarted) {
            togglePause();
        }
    });

    // Animation loop
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

            if (player.gameOver) {
                frameCount++;
                if (frameCount % 15 === 0) {
                    currentColor = getNextColor();
                }
                ctx.fillStyle = currentColor;
                ctx.font = '60px Pixelify Sans';
                ctx.fillText('Game Over!', canvas.width / 2 - 150, canvas.height / 2 - 50);

                if (frameCount > 1000) {
                    gameStarted = false;
                    frameCount = 0;
                    colorIndex = 0;
                    currentColor = colors[colorIndex];
                    score = 0;
                }
            }
        }
        requestAnimationFrame(animate);
    }

    // Initialize the game after sprites are loaded
    let tallBuildingSprite, medBuildingSprite, smallBuildingSprite;

    // preloadSprites function
    function preloadSprites(callback) {
        let loadedCount = 0;
        const totalSprites = 4;

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
    }

    preloadSprites(() => {
        animate();
    });
});