class Timer {
    constructor() {
        this.totalBlocks = 7;
        this.currentBlock = 1;
        this.blockDuration = 60 * 60; // 60 minutos em segundos
        this.timeRemaining = this.blockDuration;
        this.isRunning = false;
        this.isPaused = false;
        this.restDuration = 60; // Duração total do descanso em minutos
        this.restTimeRemaining = 0;
        this.isResting = false;
        this.timerInterval = null;
        this.totalTimeElapsed = 0;
        this.totalRestTimeUsed = 0;
        this.totalRestTimeAvailable = this.restDuration * 60; // 60 minutos em segundos
        this.remainingRestTime = this.totalRestTimeAvailable;
        
        // Inicializa o som do alarme
        this.alarmSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        this.alarmSound.loop = false; // Desativa o loop do som

        this.initializeElements();
        this.setupEventListeners();
        this.setupBlockClickListeners();
        this.setupProgressBarClick();
    }

    initializeElements() {
        // Timer elements
        this.minutesElement = document.getElementById('minutes');
        this.secondsElement = document.getElementById('seconds');
        this.currentBlockElement = document.getElementById('current-block');
        this.progressElement = document.getElementById('progress');
        this.progressBarElement = document.getElementById('progress-bar');
        
        // Total time elements
        this.totalTimeElement = document.getElementById('total-time');
        this.totalRestTimeElement = document.getElementById('total-rest-time');
        
        // Buttons
        this.startButton = document.getElementById('start-btn');
        this.pauseButton = document.getElementById('pause-btn');
        this.resetButton = document.getElementById('reset-btn');
        this.interruptRestButton = document.createElement('button');
        this.interruptRestButton.textContent = 'Interromper Descanso';
        this.interruptRestButton.style.display = 'none';
        this.interruptRestButton.addEventListener('click', () => this.finishRest());
        this.restOptionsElement = document.getElementById('rest-options');
        this.restOptionsElement.appendChild(this.interruptRestButton);
        this.restYesButton = document.getElementById('rest-yes');
        this.restNoButton = document.getElementById('rest-no');
        this.restTimerElement = document.querySelector('.rest-timer');
        this.restMinutesElement = document.getElementById('rest-minutes');
        this.restSecondsElement = document.getElementById('rest-seconds');
        this.restDurationInput = document.getElementById('rest-duration');
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.start());
        this.pauseButton.addEventListener('click', () => this.pause());
        this.resetButton.addEventListener('click', () => this.reset());
        this.restYesButton.addEventListener('click', () => this.startRest());
        this.restNoButton.addEventListener('click', () => {
            if (!this.isResting) {
                this.nextBlock();
            }
        });
        this.restDurationInput.addEventListener('change', (e) => {
            const newDuration = parseInt(e.target.value);
            if (newDuration > 0) {
                this.restDuration = newDuration;
                this.totalRestTimeAvailable = this.restDuration * 60;
                this.remainingRestTime = this.totalRestTimeAvailable;
            }
        });
    }

    setupBlockClickListeners() {
        const blocks = document.querySelectorAll('.block');
        blocks.forEach((block, index) => {
            block.style.cursor = 'pointer';
            block.addEventListener('click', () => {
                if (!this.isRunning && !this.isResting) {
                    this.selectBlock(index + 1);
                }
            });
        });
    }

    setupProgressBarClick() {
        this.progressBarElement.addEventListener('click', (e) => {
            if (!this.isRunning || this.isResting) return;
            
            const rect = this.progressBarElement.getBoundingClientRect();
            const clickPosition = (e.clientX - rect.left) / rect.width;
            const newTimeRemaining = Math.floor((1 - clickPosition) * this.blockDuration);
            
            if (newTimeRemaining >= 0 && newTimeRemaining <= this.blockDuration) {
                this.timeRemaining = newTimeRemaining;
                this.updateDisplay();
                this.updateProgress();
            }
        });
    }

    selectBlock(blockNumber) {
        if (blockNumber < 1 || blockNumber > this.totalBlocks) return;
        
        this.currentBlock = blockNumber;
        this.timeRemaining = this.blockDuration;
        this.updateDisplay();
        this.updateProgress();
        this.updateBlocks();
        
        // Mostrar mensagem de confirmação
        const confirmMessage = `Bloco ${blockNumber} selecionado. Os blocos anteriores serão marcados como concluídos.`;
        alert(confirmMessage);
    }

    start() {
        if (this.isResting) {
            // Se estiver em descanso, interrompe o descanso
            if (confirm('Deseja realmente interromper o tempo de descanso?')) {
                this.remainingRestTime += this.restTimeRemaining; // Devolve o tempo não usado
                this.stopAlarm(); // Para o alarme ao interromper o descanso
                this.finishRest();
            }
        } else if (!this.isRunning || this.isPaused) {
            this.isRunning = true;
            this.isPaused = false;
            this.startButton.textContent = 'Iniciar';
            this.startButton.disabled = true;
            this.pauseButton.disabled = false;
            this.playAlarm(); // Toca o alarme ao iniciar um bloco
            this.timerInterval = setInterval(() => this.tick(), 1000);
        }
    }

    pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            this.startButton.disabled = false;
            this.pauseButton.disabled = true;
            clearInterval(this.timerInterval);
        } else if (this.isPaused) {
            this.isPaused = false;
            this.startButton.disabled = true;
            this.pauseButton.disabled = false;
            this.timerInterval = setInterval(() => this.tick(), 1000);
        }
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentBlock = 1;
        this.timeRemaining = this.blockDuration;
        this.isResting = false;
        this.totalTimeElapsed = 0;
        this.totalRestTimeUsed = 0;
        this.remainingRestTime = this.totalRestTimeAvailable;
        clearInterval(this.timerInterval);
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
        this.restOptionsElement.style.display = 'none';
        this.restTimerElement.style.display = 'none';
        this.stopAlarm(); // Para o alarme ao resetar
        this.updateDisplay();
        this.updateProgress();
        this.updateBlocks();
        this.updateTotalTime();
        this.updateTotalRestTime();
    }

    tick() {
        if (this.isResting) {
            this.restTimeRemaining--;
            this.totalRestTimeUsed++;
            this.updateRestDisplay();
            this.updateTotalRestTime();
            if (this.restTimeRemaining <= 0) {
                this.finishRest();
            }
        } else {
            this.timeRemaining--;
            this.totalTimeElapsed++;
            this.updateDisplay();
            this.updateProgress();
            this.updateTotalTime();
            if (this.timeRemaining <= 0) {
                this.finishBlock();
            }
        }
    }

    finishBlock() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.startButton.disabled = true;
        this.pauseButton.disabled = true;
        this.playAlarm(); // Toca o alarme ao terminar o bloco

        if (this.currentBlock < this.totalBlocks) {
            this.showRestOptions();
        } else {
            alert('Parabéns! Você completou todos os blocos!');
            this.stopAlarm(); // Para o alarme após o alerta
            this.reset();
        }
    }

    showRestOptions() {
        this.restOptionsElement.style.display = 'block';
    }

    startRest() {
        this.isResting = true;
        this.restOptionsElement.style.display = 'none';
        this.restTimerElement.style.display = 'block';
        
        // Atualiza o botão Iniciar para Interromper Descanso
        this.startButton.textContent = 'Interromper Descanso';
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
        
        this.stopAlarm(); // Para o alarme ao iniciar o descanso
        
        // Calcula o tempo de descanso baseado no tempo restante total
        const remainingBlocks = this.totalBlocks - this.currentBlock;
        if (remainingBlocks > 0) {
            this.restTimeRemaining = Math.floor(this.remainingRestTime / remainingBlocks);
            this.remainingRestTime -= this.restTimeRemaining;
        } else {
            this.restTimeRemaining = this.remainingRestTime;
            this.remainingRestTime = 0;
        }
        
        this.updateRestDisplay();
        this.updateRestTimeInfo();
        this.timerInterval = setInterval(() => this.tick(), 1000);
    }

    updateRestTimeInfo() {
        // Adiciona informação sobre o tempo de descanso restante total
        const minutes = Math.floor(this.remainingRestTime / 60);
        const seconds = this.remainingRestTime % 60;
        const restTimeInfo = `Tempo de descanso restante total: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Atualiza ou cria o elemento de informação
        if (!this.restTimeInfoElement) {
            this.restTimeInfoElement = document.createElement('p');
            this.restTimeInfoElement.style.marginTop = '10px';
            this.restTimerElement.appendChild(this.restTimeInfoElement);
        }
        this.restTimeInfoElement.textContent = restTimeInfo;
    }

    finishRest() {
        clearInterval(this.timerInterval);
        this.isResting = false;
        this.restTimerElement.style.display = 'none';
        this.startButton.textContent = 'Iniciar';
        this.nextBlock();
    }

    nextBlock() {
        this.currentBlock++;
        this.timeRemaining = this.blockDuration;
        this.restOptionsElement.style.display = 'none';
        this.updateDisplay();
        this.updateBlocks();
        this.startButton.disabled = false;
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.minutesElement.textContent = minutes.toString().padStart(2, '0');
        this.secondsElement.textContent = seconds.toString().padStart(2, '0');
        this.currentBlockElement.textContent = this.currentBlock;
    }

    updateRestDisplay() {
        const minutes = Math.floor(this.restTimeRemaining / 60);
        const seconds = this.restTimeRemaining % 60;
        this.restMinutesElement.textContent = minutes.toString().padStart(2, '0');
        this.restSecondsElement.textContent = seconds.toString().padStart(2, '0');
    }

    updateProgress() {
        const progress = ((this.blockDuration - this.timeRemaining) / this.blockDuration) * 100;
        this.progressElement.style.width = `${progress}%`;
    }

    updateBlocks() {
        const blocks = document.querySelectorAll('.block');
        blocks.forEach((block, index) => {
            if (index + 1 < this.currentBlock) {
                block.classList.add('completed');
                block.classList.remove('active');
            } else if (index + 1 === this.currentBlock) {
                block.classList.add('active');
                block.classList.remove('completed');
            } else {
                block.classList.remove('active', 'completed');
            }
            
            // Adicionar título para mostrar o número do bloco ao passar o mouse
            block.title = `Clique para começar do Bloco ${index + 1}`;
        });
    }

    updateTotalTime() {
        const hours = Math.floor(this.totalTimeElapsed / 3600);
        const minutes = Math.floor((this.totalTimeElapsed % 3600) / 60);
        const seconds = this.totalTimeElapsed % 60;
        
        this.totalTimeElement.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateTotalRestTime() {
        const minutes = Math.floor(this.totalRestTimeUsed / 60);
        const seconds = this.totalRestTimeUsed % 60;
        
        this.totalRestTimeElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    playAlarm() {
        this.alarmSound.currentTime = 0; // Reinicia o som do início
        this.alarmSound.play();
        
        // Para o som após 1 segundo
        setTimeout(() => {
            this.stopAlarm();
        }, 1000);
    }

    stopAlarm() {
        this.alarmSound.pause();
        this.alarmSound.currentTime = 0;
    }
}

// Inicializar o timer quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new Timer();
}); 