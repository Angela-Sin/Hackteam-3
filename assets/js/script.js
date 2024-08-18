document.addEventListener('DOMContentLoaded', function() {
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
    let difficultySelected = false; // Track if difficulty is selected
    let gameWon = false; // Track if the game is won

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

        // Reset player properties
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

        // Draw player sprite on canvas
        draw() {
            ctx.drawImage(playerSprite, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }

        // Update player position and handle game-over conditions
        update() {
            if (this.gameOver || !gameStarted) return;
            this.x += this.speed * this.direction;

            // Change direction and move down when reaching canvas boundaries
            if (this.x + this.width / 2 > canvas.width || this.x - this.width / 2 < 0) {
                this.direction *= -1; // Reverse direction
                this.y += this.verticalStep; // Move down

                // Stop the game if any part of the sprite touches the bottom
                if (this.y + this.height / 2 >= canvas.height) {
                    this.gameOver = true;
                    this.y = canvas.height - this.height / 2;
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

        // Draw projectile on canvas
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'red';
            ctx.fill();
            ctx.closePath();
        }

        // Update projectile position and deactivate if it goes off-screen
        update() {
            this.y += this.speed;
            if (this.y - this.radius > canvas.height) {
                this.active = false;
            }
        }

        // Check if the projectile collides with a building
        checkCollision(building) {
            const dx = this.x - (building.x + building.width / 2);
            const dy = this.y - (building.y + building.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            return distance < this.radius + Math.min(building.width, building.height) / 2;
        }
    }

    // Array to hold projectiles
    const projectiles = [];

    // buildings
    const canvasEndGap = 10;
    const buildings = [];

    // Building class
    class Building {
        constructor(x, width, health) {
            this.x = x;
            this.width = width;
            this.health = health;
            this.maxHealth = health;
            this.sprite = this.selectSprite();
            this.spriteWidth = 48;
            this.spriteHeight = 202;
            this.scale = this.width / this.spriteWidth;
            this.height = this.spriteHeight * this.scale;
            this.y = canvas.height - this.height;
        }

        // Select the sprite based on building health
        selectSprite() {
            if (this.health === 3) return tallBuildingSprite;
            if (this.health === 2) return medBuildingSprite;
            return smallBuildingSprite;
        }

        // Draw building and its health bar on canvas
        draw() {
            const spriteX = (this.maxHealth - this.health) * this.spriteWidth;
            ctx.drawImage(
                this.sprite,
                spriteX, 0,
                this.spriteWidth, this.spriteHeight,
                this.x, this.y,
                this.width, this.height
            );
            
            // Draw health bar for debugging
            const healthBarHeight = 5;
            const healthPercentage = this.health / this.maxHealth;
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y - healthBarHeight - 2, this.width, healthBarHeight);
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x, this.y - healthBarHeight - 2, this.width * healthPercentage, healthBarHeight);
        }

        // Decrease health on hit
        hit() {
            this.health--;
            if (this.health < 0) this.health = 0; // Ensure health doesn't go below zero
        }

        // Check if the building is destroyed
        isDestroyed() {
            return this.health <= 0;
        }
    }

    // Create a row of buildings on the canvas
    function createBuildings() {
        buildings.length = 0;
        let x = canvasEndGap;
        const buildingWidth = 40;
        const buildingGap = 1;
        
        while (x + buildingWidth <= canvas.width - canvasEndGap) {
            const health = Math.floor(Math.random() * 3) + 1; 
            buildings.push(new Building(x, buildingWidth, health));
            x += buildingWidth + buildingGap;
        }
    }

    // Simulate collision and update score
    function simulateCollision(building) {
        if (building.health > 0) {
            building.hit(); // Decrease health
            score += 10; // Increment score by 10 for each hit
            
            if (building.isDestroyed()) { // Remove building if health is zero
                const index = buildings.indexOf(building);
                if (index > -1) {
                    buildings.splice(index, 1);
                }
                
                // Check if all buildings are destroyed
                if (buildings.length === 0) {
                    score += 100; // Add 100 points if no buildings are left
                    gameWon = true; // Set gameWon to true when all buildings are destroyed
                }
            }
        }
    }

    // Draw all buildings on canvas
    function drawBuildings() {
        buildings.forEach(building => building.draw());
    }

    // Draw all projectiles on canvas
    function drawProjectiles() {
        projectiles.forEach(projectile => projectile.draw());
    }

    // Update position of all projectiles and remove inactive ones
    function updateProjectiles() {
        projectiles.forEach(projectile => {
            projectile.update();
            if (!projectile.active) {
                const index = projectiles.indexOf(projectile);
                if (index > -1) projectiles.splice(index, 1);
            }
        });
    }

    // Handle collisions between projectiles and buildings
    function handleProjectileCollisions() {
        projectiles.forEach(projectile => {
            buildings.forEach(building => {
                if (projectile.checkCollision(building)) {
                    simulateCollision(building);
                    projectile.active = false; // Deactivate projectile
                }
            });
        });
    }

    // Handle collisions between player and buildings
    function handleCollisions() {
        buildings.forEach(building => {
            if (
                player.x + player.width / 2 > building.x &&
                player.x - player.width / 2 < building.x + building.width &&
                player.y + player.height / 2 > building.y &&
                player.y - player.height / 2 < building.y + building.height
            ) {
                player.gameOver = true; // Trigger game over on collision with building
            }
        });
    }

    // Draw the current score on the screen
    function drawScore() {
        const scoreBoard = document.getElementById('scoreBoard');
        scoreBoard.textContent = 'Score: ' + score;
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

    // Event listener for difficulty selection and projectile dropping
    document.addEventListener('keydown', function(event) {
        if (!gameStarted && !difficultySelected) {
            if (event.key === '1') {
                selectedDifficulty = 'easy';
                difficultySelected = true; // Mark difficulty as selected
                startGame();
            } else if (event.key === '2') {
                selectedDifficulty = 'normal';
                difficultySelected = true; // Mark difficulty as selected
                startGame();
            } else if (event.key === '3') {
                selectedDifficulty = 'hard';
                difficultySelected = true; // Mark difficulty as selected
                startGame();
            }
        } else if (event.key === ' ' && gameStarted && canDropBomb) { // Space key to drop projectile
            projectiles.push(new Projectile(player.x, player.y + player.height / 2));
            canDropBomb = false;
        }
    });

    // Event listener for mouse input to drop projectiles
    canvas.addEventListener('mousedown', function(event) {
        if (gameStarted && canDropBomb) {
            projectiles.push(new Projectile(player.x, player.y + player.height / 2));
            canDropBomb = false;
        }
    });

    // Allow dropping another bomb when the previous one lands
    function checkIfCanDropBomb() {
        if (projectiles.every(p => !p.active)) {
            canDropBomb = true;
        }
    }

    // Initialize game state and start the game
    function startGame() {
        gameStarted = true;
        gameWon = false; // Reset gameWon
        player.reset();
        createBuildings();
        projectiles.length = 0;
        canDropBomb = true;
    }

    // Animation loop with color changes for win/loss messages
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
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBuildings();
            drawProjectiles();
            player.update();
            player.draw();
            updateProjectiles();
            handleProjectileCollisions();
            handleCollisions();
            checkIfCanDropBomb();
    
            drawScore(); // Draw the score during the game

            if (gameWon) {
                frameCount++;
                if (frameCount % 15 === 0) {
                    currentColor = getNextColor();
                }
                ctx.fillStyle = currentColor;
                ctx.font = '60px Pixelify Sans';
                ctx.fillText('You Win!', canvas.width / 2 - 150, canvas.height / 2 - 50);

                if (frameCount > 1000) {
                    gameStarted = false;
                    difficultySelected = false; // Allow difficulty selection again
                    frameCount = 0;
                    colorIndex = 0;
                    currentColor = colors[colorIndex];
                    score = 0;
                }
            } else if (player.gameOver) {
                frameCount++;
                if (frameCount % 15 === 0) {
                    currentColor = getNextColor();
                }
                ctx.fillStyle = currentColor;
                ctx.font = '60px Pixelify Sans';
                ctx.fillText('Game Over!', canvas.width / 2 - 150, canvas.height / 2 - 50);
    
                if (frameCount > 1000) {
                    gameStarted = false;
                    difficultySelected = false; // Allow difficulty selection again
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

    // Preload sprites and initialize game objects
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

    // Start the animation loop after sprites are preloaded
    preloadSprites(() => {
        animate();
    });
});
