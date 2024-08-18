document.addEventListener('DOMContentLoaded', function () {
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

    // Ensure volume is set (default is 1.0)
    Object.values(sounds).forEach(sound => sound.volume = 1.0);

    // Play background music in a loop
    sounds.backgroundMusic.loop = true;

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

        selectSprite() {
            if (this.health === 3) return tallBuildingSprite;
            if (this.health === 2) return medBuildingSprite;
            return smallBuildingSprite;
        }

        draw() {
            const spriteX = (this.maxHealth - this.health) * this.spriteWidth;
            ctx.drawImage(
                this.sprite,
                spriteX, 0,
                this.spriteWidth, this.spriteHeight,
                this.x, this.y,
                this.width, this.height
            );

<<<<<<< HEAD
            // Draw health bar   -    temp for checking hits
=======
            // Draw health bar - temporary for checking hits
>>>>>>> bcfc6674cc2797816b9ce232dba6422e4a51f8b4
            const healthBarHeight = 5;
            const healthPercentage = this.health / this.maxHealth;
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y - healthBarHeight - 2, this.width, healthBarHeight);
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x, this.y - healthBarHeight - 2, this.width * healthPercentage, healthBarHeight);
        }

        hit() {
            this.health--;
            if (this.health < 0) this.health = 0; // Ensure health doesn't go below zero
        }

        isDestroyed() {
            return this.health <= 0;
        }
    }

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

    // Simulate a hit on collision
    function simulateCollision(building) {
        if (building.health > 0) {
            building.hit(); // Decrease health
            if (building.isDestroyed()) { // Remove only if health is zero
                const index = buildings.indexOf(building);
                if (index > -1) {
                    buildings.splice(index, 1);
                }
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
                    sounds.bombHit.play(); // Play bomb hit sound
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
            if (event.key === '1' || event.key === '2' || event.key === '3') {
                selectedDifficulty = event.key === '1' ? 'easy' : event.key === '2' ? 'normal' : 'hard';
                sounds.levelChange.play();
                startGame(); // Start game after difficulty is selected
            }
        } else if (event.key === ' ' && canDropBomb) {
            dropBomb(); // Drop bomb with sound
        }
    });

    // Similar mouse interaction to start sounds
    canvas.addEventListener('mousedown', function (event) {
        if (!gameStarted) {
            startGame(); // Start game on click, allow sounds
        } else if (canDropBomb) {
            dropBomb(); // Drop bomb with sound
        }
    });

    function drawScore() {
        ctx.fillStyle = 'yellow';
        ctx.fillText('Score: ' + score, 20, 50);
    }

    function dropBomb() {
        if (canDropBomb) {
            projectiles.push(new Projectile(player.x, player.y + player.height / 2));
            canDropBomb = false;
            sounds.bombDrop.play();
        }
    }

    function startGame() {
        sounds.backgroundMusic.play(); // Start music after user interaction
        gameStarted = true;
        player.reset();
        createBuildings();
        projectiles.length = 0;
        canDropBomb = true;
        isPaused = false; // Ensure the game is not paused when starting
    }

<<<<<<< HEAD
    function handleGameOver() {
        if (player.gameOver) {
            sounds.backgroundMusic.pause(); // Stop background music
            sounds.gameOver.play(); // Play game over sound
        }
=======
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
>>>>>>> bcfc6674cc2797816b9ce232dba6422e4a51f8b4
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!gameStarted) {
            drawDifficultySelection();
<<<<<<< HEAD
        } else {
=======
        } else if (!isPaused) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBuildings();
            drawProjectiles();
>>>>>>> bcfc6674cc2797816b9ce232dba6422e4a51f8b4
            player.update();
            updateProjectiles();
            handleProjectileCollisions();
            drawBuildings();
            drawProjectiles();
            drawScore();
            player.draw();
            handleGameOver();
        }

        requestAnimationFrame(animate);
    }

    function preloadSprites(callback) {
        const spriteSheet1 = new Image();
        const spriteSheet2 = new Image();
        const spriteSheet3 = new Image();
        const playerImg = new Image();

        let loadedSprites = 0;
        const spriteLoaded = () => {
            loadedSprites++;
            if (loadedSprites === 4) callback();
        };

        spriteSheet1.src = 'assets/images/buildings/spritesheet1.png';
        spriteSheet2.src = 'assets/images/buildings/spritesheet2.png';
        spriteSheet3.src = 'assets/images/buildings/spritesheet3.png';
        playerImg.src = 'assets/images/playerSprite.png';

        spriteSheet1.onload = spriteLoaded;
        spriteSheet2.onload = spriteLoaded;
        spriteSheet3.onload = spriteLoaded;
        playerImg.onload = spriteLoaded;

        smallBuildingSprite = spriteSheet1;
        medBuildingSprite = spriteSheet2;
        tallBuildingSprite = spriteSheet3;
        playerSprite = playerImg;
    }

    // Initialize the player
    player = new Player();

    preloadSprites(() => {
        animate();
    });
});

// js for modal

const openModalButtons = document.querySelectorAll('[data-modal-target]')
const closeModalButtons = document.querySelectorAll('[data-close-button]')
const overlay = document.getElementById('overlay')

openModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = document.querySelector(button.dataset.modalTarget)
    openModal(modal)
  })
})

overlay.addEventListener('click', () => {
  const modals = document.querySelectorAll('.modal.active')
  modals.forEach(modal => {
    closeModal(modal)
  })
})

closeModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = button.closest('.modal')
    closeModal(modal)
  })
})

function openModal(modal) {
  if (modal == null) return
  modal.classList.add('active')
  overlay.classList.add('active')
}

function closeModal(modal) {
  if (modal == null) return
  modal.classList.remove('active')
  overlay.classList.remove('active')
}