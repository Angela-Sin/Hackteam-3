document.addEventListener('DOMContentLoaded', function() {
    // Canvas setup
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 500;

    let score = 0;
    ctx.font = '50px Pixelify Sans';

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
            this.speed = 5;                     // speed controller
            this.direction = 1;
            this.verticalStep = this.height / 2;
            this.gameOver = false;
        }
    
        draw() {
            ctx.drawImage(playerSprite, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
    
        update() {
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
        buildings.length = 0; // Clear any existing buildings
        let x = canvasEndGap;
        while (x < canvas.width - canvasEndGap) {
            const health = Math.floor(Math.random() * 3) + 1; // Random health between 1 and 3
            buildings.push(new Building(x, buildingWidth, health));
            x += buildingWidth + buildingGap;
        }
    }

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

            if (frameCount > 1000) { // Reset after some delay
                player.reset();
                frameCount = 0;
                colorIndex = 0;
                currentColor = colors[colorIndex];
                score = 0;
                createBuildings(); // Recreate buildings
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