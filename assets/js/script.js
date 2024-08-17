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

    // Set up font for text rendering
    ctx.font = '50px Pixelify Sans';


    // Difficulty settings
    const difficultySettings = {
        easy: 5,
        normal: 10,
        hard: 15,
    };

    let player;
    let playerSprite;


    // Player class
    class Player {
        constructor() {
            this.reset();
        }
    
        reset() {

            this.radius = 25;
            this.x = this.radius;
            this.y = this.radius;
            this.speed = difficultySettings[selectedDifficulty];

            this.width = 70;
            this.height = 70;
            this.x = this.width / 2;
            this.y = this.height / 2;
            this.speed = 5;                     // speed controller

            this.direction = 1;
            this.verticalStep = this.height / 2;
            this.gameOver = false;
        }
    
        draw() {
            ctx.drawImage(playerSprite, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
    
        update() {

            if (this.gameOver || !gameStarted) return;


            if (this.gameOver) return;
    

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
            this.maxHeight = this.calculateHeight();
            this.currentHeight = this.maxHeight;
            this.y = canvas.height - this.currentHeight;
        }

        calculateHeight() {
            return minHeight + (this.health * (maxBuildingHeight - minHeight) / 3);
        }

        draw() {
            ctx.fillStyle = 'darkblue';
            ctx.fillRect(this.x, this.y, this.width, this.currentHeight);
        }

        hit() {
            this.health--;
            this.currentHeight = Math.max(minHeight, this.currentHeight - (this.maxHeight - minHeight) / 3);
            this.y = canvas.height - this.currentHeight;
        }

        isDestroyed() {
            return this.health <= 0;
        }
    }

    function createBuildings() {
        buildings.length = 0; 
        let x = canvasEndGap;

        while (x < canvasWidth - canvasEndGap) {
            const health = Math.floor(Math.random() * 3) + 1; 

        while (x < canvas.width - canvasEndGap) {
            const health = Math.floor(Math.random() * 3) + 1; // Random health between 1 and 3

            buildings.push(new Building(x, buildingWidth, health));
            x += buildingWidth + buildingGap;
        }
    }


    createBuildings(); 


    // Simulate a hit on collision

    function simulateCollision(building) {
        building.hit();
        if (building.isDestroyed()) {
            const index = buildings.indexOf(building);
            if (index > -1) {
                buildings.splice(index, 1);
            }
        }
    }

    function drawBuildings() {
        buildings.forEach(building => building.draw());
    }

    function handleCollisions() {
        buildings.forEach(building => {
            if (
                player.x + player.width / 2 > building.x &&
                player.x - player.width / 2 < building.x + building.width &&
                player.y + player.height / 2 > building.y &&
                player.y - player.height / 2 < building.y + building.currentHeight
            ) {
                simulateCollision(building);
                score++;
            }
        });
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
    document.addEventListener('keydown', function(event) {
        if (!gameStarted) {
            if (event.key === '1') {
                selectedDifficulty = 'easy';
                startGame();
            } else if (event.key === '2') {
                selectedDifficulty = 'normal';
                startGame();
            } else if (event.key === '3') {
                selectedDifficulty = 'hard';
                startGame();
            }
        }
    });

    // Start the game
    function startGame() {
        gameStarted = true;
        player.reset();
        createBuildings();
    }


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
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBuildings();
            player.update();
            player.draw();
            handleCollisions();

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
    function preloadSprites(callback) {
        playerSprite = new Image();
        playerSprite.onload = () => {
            player = new Player();
            createBuildings();
            callback();
        };
        playerSprite.src = 'assets/media/ufo.png';
    }

    preloadSprites(() => {
        animate();
    });
});