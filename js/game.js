class SnowboardGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.running = false;
        this.score = 0;
        
        // Game objects
        this.rider = {
            x: 80,
            y: 260,
            width: 40,
            height: 40,
            velocityY: 0,
            jumping: false,
            rotation: 0
        };
        
        this.ground = 280;
        this.obstacles = [];
        this.particles = [];
        this.lastSpawn = 0;
        this.spawnInterval = 1500;
        
        // Load assets
        this.sprites = {
            rider: new Image(),
            tree: new Image(),
            mountain: new Image()
        };
        
        this.sprites.rider.src = 'images/game/rider.png';
        this.sprites.tree.src = 'images/game/tree.png';
        this.sprites.mountain.src = 'images/game/mountain.png';
        
        // Bind methods
        this.animate = this.animate.bind(this);
        this.handleJump = this.handleJump.bind(this);
        
        // Setup events
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') this.handleJump();
        });
        this.canvas.addEventListener('click', this.handleJump);
        
        // Initial setup
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = this.canvas.clientWidth * devicePixelRatio;
        this.canvas.height = 360 * devicePixelRatio;
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
    }
    
    start() {
        this.running = true;
        this.score = 0;
        this.obstacles = [];
        this.particles = [];
        this.rider.y = this.ground;
        this.rider.velocityY = 0;
        this.rider.jumping = false;
        this.lastSpawn = performance.now();
        this.animate();
    }
    
    stop() {
        this.running = false;
    }
    
    handleJump() {
        if (!this.rider.jumping) {
            this.rider.velocityY = -15;
            this.rider.jumping = true;
            this.createParticles(this.rider.x, this.rider.y + this.rider.height);
        }
    }
    
    createParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 6,
                vy: -Math.random() * 6,
                alpha: 1
            });
        }
    }
    
    update() {
        // Rider physics
        if (this.rider.jumping) {
            this.rider.velocityY += 0.8;
            this.rider.y += this.rider.velocityY;
            this.rider.rotation = Math.min(this.rider.velocityY * 2, 45);
            
            if (this.rider.y >= this.ground) {
                this.rider.y = this.ground;
                this.rider.velocityY = 0;
                this.rider.jumping = false;
                this.rider.rotation = 0;
                this.createParticles(this.rider.x, this.ground);
            }
        }
        
        // Spawn obstacles
        const now = performance.now();
        if (now - this.lastSpawn > this.spawnInterval) {
            this.spawnObstacle();
            this.lastSpawn = now;
            this.spawnInterval = Math.max(1000, 1500 - this.score * 10);
        }
        
        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= 6;
            
            // Score points
            if (!obs.passed && obs.x + obs.width < this.rider.x) {
                obs.passed = true;
                this.score++;
            }
            
            // Remove if off screen
            if (obs.x + obs.width < 0) {
                this.obstacles.splice(i, 1);
            }
            
            // Collision detection
            if (this.checkCollision(obs)) {
                this.stop();
                this.createParticles(this.rider.x + this.rider.width/2, this.rider.y + this.rider.height/2);
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.alpha -= 0.02;
            
            if (p.alpha <= 0) this.particles.splice(i, 1);
        }
    }
    
    checkCollision(obstacle) {
        return (
            this.rider.x < obstacle.x + obstacle.width &&
            this.rider.x + this.rider.width > obstacle.x &&
            this.rider.y < obstacle.y + obstacle.height &&
            this.rider.y + this.rider.height > obstacle.y
        );
    }
    
    spawnObstacle() {
        this.obstacles.push({
            x: this.canvas.clientWidth + 20,
            y: this.ground - 40,
            width: 30,
            height: 40,
            passed: false
        });
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.height);
        
        // Draw background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0d1729');
        gradient.addColorStop(1, '#1a1f35');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.height);
        
        // Draw mountains
        this.ctx.fillStyle = '#1a2436';
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(-50 + i * 200, this.ground);
            this.ctx.lineTo(50 + i * 200, 200);
            this.ctx.lineTo(150 + i * 200, this.ground);
            this.ctx.fill();
        }
        
        // Draw ground
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, this.ground, this.canvas.clientWidth, 80);
        
        // Draw particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = `rgba(124, 58, 237, ${p.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw obstacles
        this.ctx.fillStyle = '#2d3748';
        this.obstacles.forEach(obs => {
            this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        });
        
        // Draw rider
        this.ctx.save();
        this.ctx.translate(this.rider.x + this.rider.width/2, this.rider.y + this.rider.height/2);
        this.ctx.rotate(this.rider.rotation * Math.PI / 180);
        this.ctx.fillStyle = '#7c3aed';
        this.ctx.fillRect(-this.rider.width/2, -this.rider.height/2, this.rider.width, this.rider.height);
        this.ctx.restore();
        
        // Draw score
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Inter';
        this.ctx.fillText(`Score: ${this.score}`, 20, 40);
        
        // Draw game over
        if (!this.running) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(this.canvas.clientWidth/2 - 150, 140, 300, 80);
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Press SPACE or Click to Start', this.canvas.clientWidth/2, 185);
            this.ctx.textAlign = 'left';
        }
    }
    
    animate() {
        if (!this.running) return;
        this.update();
        this.draw();
        requestAnimationFrame(this.animate);
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    const game = new SnowboardGame('gameCanvas');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    startBtn.addEventListener('click', () => {
        if (!game.running) {
            game.start();
            startBtn.textContent = 'Pause';
        } else {
            game.stop();
            startBtn.textContent = 'Resume';
        }
    });
    
    resetBtn.addEventListener('click', () => {
        game.stop();
        game.score = 0;
        startBtn.textContent = 'Start';
        game.draw();
    });
    
    // Initial draw
    game.draw();
});
