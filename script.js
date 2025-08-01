document.addEventListener("DOMContentLoaded", () => {
    const center = new SpaceGameCenter();
});

class SpaceGameCenter {
    constructor() {
        this.currentGame = 'codeHunter';
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.level = 1;
        this.timeLeft = 60;
        this.gameTimer = null;
        this.animationFrame = null;

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.gameCards = document.querySelectorAll('.game-card');
        this.gameTitle = document.getElementById('currentGameTitle');
        this.gameScore = document.getElementById('gameScore');
        this.gameTime = document.getElementById('gameTime');
        this.gameLevel = document.getElementById('gameLevel');

        this.tagPool = document.getElementById('tagPool');
        this.dropZone = document.getElementById('dropZone');
        this.targetStructure = document.getElementById('targetStructure');

        this.cssQuestion = document.getElementById('cssQuestion');
        this.cssInput = document.getElementById('cssInput');
        this.playerShip = document.getElementById('playerShip');

        this.codeToDebug = document.getElementById('codeToDebug');
        this.debugOptions = document.getElementById('debugOptions');

        this.estrella = document.getElementById('estrella');

        this.gameData = {
            codeHunter: {
                title: '🎯 Cazador de Códigos',
                ship: { x: 350, y: 400, width: 40, height: 20, speed: 5 },
                items: [],
                keys: {},
                goodCodes: ['<div>', '<p>', '<h1>', 'function()', 'const x =', '{color: blue}', 'display: flex', '<header>', '<nav>', 'addEventListener'],
                badCodes: ['<dog>', '++html', '@wrong', 'funk()', '<divv>', 'colour: blue', 'displai: flex', '<heder>', '<nev>', 'addEventListner']
            },
            starCollector: {
                title: '⭐ Recolector Estelar',
                score: 0
            },
            tagBuilder: {
                title: '🏗️ Constructor Galáctico',
                availableTags: ['<html>', '<head>', '<body>', '<div>', '<p>', '<h1>', '<nav>', '<header>', '<footer>', '<section>'],
                targetStructures: [
                    ['<html>', '<head>', '<body>'],
                    ['<header>', '<nav>', '<section>', '<footer>'],
                    ['<div>', '<h1>', '<p>']
                ],
                currentTarget: 0,
                currentStructure: []
            },
            cssRacer: {
                title: '🏎️ Carrera CSS',
                challenges: [
                    { question: 'Seleccionar todos los párrafos:', answer: 'p' },
                    { question: 'Seleccionar por ID "menu":', answer: '#menu' },
                    { question: 'Seleccionar por clase "button":', answer: '.button' },
                    { question: 'Color de texto rojo:', answer: 'color: red' },
                    { question: 'Centrar texto:', answer: 'text-align: center' }
                ],
                currentChallenge: 0
            },
            debugMission: {
                title: '🔧 Misión Debug',
                bugs: [
                    {
                        code: `function saludar() {\n    console.log("Hola mundo";\n}`,
                        options: ['Falta paréntesis de cierre', 'Error de sintaxis en console', 'Falta punto y coma', 'Variable no definida'],
                        correct: 0
                    },
                    {
                        code: `let x = 5;\nif (x = 10) {\n    console.log("Es 10");\n}`,
                        options: ['Usar == en lugar de =', 'Variable x no definida', 'Falta else', 'Error en console.log'],
                        correct: 0
                    },
                    {
                        code: `for (let i = 0; i < 5 i++) {\n    console.log(i);\n}`,
                        options: ['Falta punto y coma después de 5', 'Error en console.log', 'i no está definida', 'Falta paréntesis'],
                        correct: 0
                    }
                ],
                currentBug: 0
            }
        };

        this.initListeners();
        this.loadGame(this.currentGame);
    }

    initListeners() {
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('pauseGame').addEventListener('click', () => this.pauseGame());
        document.getElementById('resetGame').addEventListener('click', () => this.resetGame());
        document.getElementById('instructionsBtn').addEventListener('click', () => {
            document.getElementById('instructionsModal').style.display = 'block';
            document.getElementById('instructionsText').innerHTML = `<p>Instrucciones del juego: ${this.gameData[this.currentGame].title}</p>`;
        });
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('instructionsModal').style.display = 'none';
        });

        this.gameCards.forEach(card => {
            card.addEventListener('click', () => {
                this.switchGame(card.dataset.game);
            });
        });

        document.addEventListener('keydown', e => {
            if (this.currentGame === 'codeHunter') this.gameData.codeHunter.keys[e.key] = true;
        });

        document.addEventListener('keyup', e => {
            if (this.currentGame === 'codeHunter') this.gameData.codeHunter.keys[e.key] = false;
        });

        this.cssSubmit = document.getElementById('cssSubmit');
        this.cssSubmit.addEventListener('click', () => this.checkCSSAnswer());
        this.cssInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') this.checkCSSAnswer();
        });

        this.estrella.addEventListener('click', () => {
            this.score += 10;
            this.estrella.style.display = 'none';
        });
    }

    switchGame(game) {
        this.resetGame();
        this.currentGame = game;
        this.gameCards.forEach(c => c.classList.remove('active'));
        document.querySelector(`[data-game="${game}"]`).classList.add('active');
        this.loadGame(game);
    }

    loadGame(game) {
        this.hideAllAreas();
        this.gameTitle.textContent = this.gameData[game].title;

        const areas = {
            codeHunter: 'gameCanvas',
            starCollector: 'starGameArea',
            tagBuilder: 'builderGameArea',
            cssRacer: 'cssRaceArea',
            debugMission: 'debugArea'
        };
        document.getElementById(areas[game]).style.display = 'block';

        if (game === 'tagBuilder') this.initTagBuilder();
        if (game === 'cssRacer') this.loadCSSChallenge();
        if (game === 'debugMission') this.loadDebug();
    }

    hideAllAreas() {
        document.getElementById('gameCanvas').style.display = 'none';
        document.getElementById('starGameArea').style.display = 'none';
        document.getElementById('builderGameArea').style.display = 'none';
        document.getElementById('cssRaceArea').style.display = 'none';
        document.getElementById('debugArea').style.display = 'none';
    }

    startGame() {
        if (this.gameRunning) return;
        this.gameRunning = true;
        this.timeLeft = 60;

        this.gameTimer = setInterval(() => {
            if (!this.gamePaused) {
                this.timeLeft--;
                this.updateUI();
                if (this.timeLeft <= 0) this.endGame();
            }
        }, 1000);

        if (this.currentGame === 'codeHunter') {
            this.spawnCodeItems();
            this.loopCodeHunter();
        }
        if (this.currentGame === 'starCollector') {
            this.spawnStar();
        }

        this.updateUI();
    }

    pauseGame() {
        this.gamePaused = !this.gamePaused;
        document.getElementById('pauseGame').textContent = this.gamePaused ? '▶️ Continuar' : '⏸️ Pausar';
    }

    resetGame() {
        this.gameRunning = false;
        this.score = 0;
        this.level = 1;
        this.timeLeft = 60;
        clearInterval(this.gameTimer);
        cancelAnimationFrame(this.animationFrame);
        this.updateUI();
        this.loadGame(this.currentGame);
    }

    updateUI() {
        this.gameScore.textContent = `Puntos: ${this.score}`;
        this.gameTime.textContent = `Tiempo: ${this.timeLeft}s`;
        this.gameLevel.textContent = `Nivel: ${this.level}`;
    }

    endGame() {
        this.gameRunning = false;
        clearInterval(this.gameTimer);
        alert(`Fin del juego.\nPuntaje: ${this.score}`);
    }

    // --------------------------
    // JUEGO 1: CODE HUNTER
    // --------------------------
    spawnCodeItems() {
        const g = this.gameData.codeHunter;
        const all = [...g.goodCodes, ...g.badCodes];
        const code = all[Math.floor(Math.random() * all.length)];
        const good = g.goodCodes.includes(code);
        g.items.push({
            text: code,
            x: Math.random() * (this.canvas.width - 80),
            y: -20,
            speed: 2 + Math.random() * 2,
            good
        });
        if (this.gameRunning && this.currentGame === 'codeHunter') {
            setTimeout(() => this.spawnCodeItems(), 800);
        }
    }

    loopCodeHunter() {
        if (!this.gameRunning || this.gamePaused) return;

        const g = this.gameData.codeHunter;
        const { ctx, canvas } = this;

        // Movimiento nave
        const ship = g.ship;
        if (g.keys['ArrowLeft'] && ship.x > 0) ship.x -= ship.speed;
        if (g.keys['ArrowRight'] && ship.x + ship.width < canvas.width) ship.x += ship.speed;

        // Actualizar ítems
        g.items.forEach(item => item.y += item.speed);

        // Colisión
        g.items = g.items.filter(item => {
            const collision = item.y + 20 >= ship.y &&
                item.x < ship.x + ship.width &&
                item.x + 80 > ship.x;

            if (collision) {
                this.score += item.good ? 10 : -5;
                return false;
            }

            return item.y <= canvas.height;
        });

        // Dibujar
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0ff';
        ctx.fillRect(ship.x, ship.y, ship.width, ship.height);
        ctx.font = '16px monospace';
        g.items.forEach(item => {
            ctx.fillStyle = item.good ? 'lime' : 'red';
            ctx.fillText(item.text, item.x, item.y);
        });

        this.updateUI();
        this.animationFrame = requestAnimationFrame(() => this.loopCodeHunter());
    }

    // --------------------------
    // JUEGO 2: STAR COLLECTOR
    // --------------------------
    spawnStar() {
        const area = document.getElementById('starGameArea');
        const star = this.estrella;
        const x = Math.random() * (area.clientWidth - 30);
        const y = Math.random() * (area.clientHeight - 30);
        star.style.left = `${x}px`;
        star.style.top = `${y}px`;
        star.style.display = 'block';

        if (this.gameRunning && this.currentGame === 'starCollector') {
            setTimeout(() => this.spawnStar(), 1000);
        }
    }

    // --------------------------
    // JUEGO 3: TAG BUILDER
    // --------------------------
    initTagBuilder() {
        const g = this.gameData.tagBuilder;
        this.tagPool.innerHTML = '';
        this.dropZone.innerHTML = '<p>Arrastra las etiquetas aquí</p>';
        this.targetStructure.textContent = g.targetStructures[g.currentTarget].join('\n');

        g.currentStructure = [];

        g.availableTags.forEach(tag => {
            const el = document.createElement('div');
            el.className = 'html-tag';
            el.textContent = tag;
            el.draggable = true;

            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', tag);
            });

            this.tagPool.appendChild(el);
        });

        this.dropZone.ondragover = e => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        };
        this.dropZone.ondragleave = () => {
            this.dropZone.classList.remove('drag-over');
        };
        this.dropZone.ondrop = e => {
            e.preventDefault();
            const tag = e.dataTransfer.getData('text/plain');
            const el = document.createElement('div');
            el.className = 'html-tag';
            el.textContent = tag;
            this.dropZone.appendChild(el);
            g.currentStructure.push(tag);

            if (JSON.stringify(g.currentStructure) === JSON.stringify(g.targetStructures[g.currentTarget])) {
                alert('¡Estructura correcta!');
                g.currentTarget = (g.currentTarget + 1) % g.targetStructures.length;
                this.initTagBuilder();
            }
        };
    }

    // --------------------------
    // JUEGO 4: CSS RACER
    // --------------------------
    loadCSSChallenge() {
        const g = this.gameData.cssRacer;
        this.cssQuestion.textContent = g.challenges[g.currentChallenge].question;
    }

    checkCSSAnswer() {
        const g = this.gameData.cssRacer;
        const answer = this.cssInput.value.trim();
        const correct = g.challenges[g.currentChallenge].answer;

        if (answer === correct) {
            this.score += 10;
            const currentLeft = parseInt(this.playerShip.style.left);
            this.playerShip.style.left = `${currentLeft + 100}px`;
            g.currentChallenge++;
            if (g.currentChallenge >= g.challenges.length) {
                alert('¡Llegaste a la meta!');
                this.resetGame();
            } else {
                this.cssInput.value = '';
                this.loadCSSChallenge();
            }
        } else {
            alert('Respuesta incorrecta. Intenta de nuevo.');
        }

        this.updateUI();
    }

    // --------------------------
    // JUEGO 5: DEBUG MISSION
    // --------------------------
    loadDebug() {
        const g = this.gameData.debugMission;
        const bug = g.bugs[g.currentBug];
        this.codeToDebug.textContent = bug.code;
        this.debugOptions.innerHTML = '';

        bug.options.forEach((option, idx) => {
            const btn = document.createElement('div');
            btn.className = 'debug-option';
            btn.textContent = option;

            btn.addEventListener('click', () => {
                if (idx === bug.correct) {
                    btn.classList.add('correct');
                    this.score += 10;
                    g.currentBug++;
                    if (g.currentBug < g.bugs.length) {
                        setTimeout(() => this.loadDebug(), 1000);
                    } else {
                        alert('¡Todos los errores corregidos!');
                        this.resetGame();
                    }
                } else {
                    btn.classList.add('incorrect');
                }

                this.updateUI();
            });

            this.debugOptions.appendChild(btn);
        });
    }
}
