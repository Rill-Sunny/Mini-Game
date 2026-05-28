const canvas = document.getElementById('minesweeperCanvas');
const ctx = canvas.getContext('2d');

const ROWS = 10, COLS = 10, MINES = 10, CELL_SIZE = 45;
const OFFSET_X = 35, OFFSET_Y = 80;

const NUM_COLORS = ['', '#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#b45309', '#0891b2', '#1f2937', '#6b7280'];

function formatBestTime(sec) {
    if (sec == null) return '暂无最高纪录';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

let grid = [], gameOver = false, win = false, startTime = Date.now(), timeSec = 0;

function initMines() {
    grid = Array(ROWS).fill().map(() =>
        Array(COLS).fill().map(() => ({ mine: false, revealed: false, flagged: false, count: 0 }))
    );
    let planted = 0;
    while (planted < MINES) {
        const r = Math.floor(Math.random() * ROWS);
        const c = Math.floor(Math.random() * COLS);
        if (!grid[r][c].mine) { grid[r][c].mine = true; planted++; }
    }
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c].mine) continue;
            let count = 0;
            for (let i = -1; i <= 1; i++)
                for (let j = -1; j <= 1; j++)
                    if (grid[r + i] && grid[r + i][c + j] && grid[r + i][c + j].mine) count++;
            grid[r][c].count = count;
        }
    }
    gameOver = false;
    win = false;
    startTime = Date.now();
    timeSec = 0;
}

function drawCell(x, y, cell) {
    const px = OFFSET_X + x;
    const py = OFFSET_Y + y;
    const s = CELL_SIZE - 2;

    if (!cell.revealed) {
        ctx.fillStyle = '#94b8e8';
        ctx.fillRect(px, py, s, s);
        ctx.fillStyle = '#c5daf5';
        ctx.fillRect(px, py, s, 4);
        ctx.fillStyle = '#5a8ec4';
        ctx.fillRect(px + s - 4, py, 4, s);
        ctx.fillStyle = '#3d6a9e';
        ctx.fillRect(px, py + s - 4, s, 4);
    } else {
        ctx.fillStyle = '#e8f2ff';
        ctx.fillRect(px, py, s, s);
        ctx.strokeStyle = '#d4e4f7';
        ctx.strokeRect(px, py, s, s);
    }

    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (cell.revealed && cell.mine) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(px + s / 2, py + s / 2, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a2b42';
        ctx.fillRect(px + s / 2 - 1, py + 4, 2, 8);
    } else if (cell.revealed && cell.count > 0) {
        ctx.fillStyle = NUM_COLORS[cell.count];
        ctx.fillText(cell.count, px + s / 2, py + s / 2);
    } else if (!cell.revealed && cell.flagged) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(px + 10, py + 10);
        ctx.lineTo(px + 10, py + s - 8);
        ctx.lineTo(px + 28, py + s / 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1a2b42';
        ctx.fillRect(px + 8, py + s - 10, 4, 10);
    }
}

function draw() {
    ctx.fillStyle = '#f4f8fc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!gameOver && !win) timeSec = Math.floor((Date.now() - startTime) / 1000);

    ctx.fillStyle = '#1a2b42';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`时间 ${timeSec} 秒`, 25, 42);
    ctx.fillStyle = '#1e6fd9';
    ctx.textAlign = 'right';
    ctx.fillText(`最快 ${formatBestTime(BEST_TIME_SEC)}`, canvas.width - 25, 42);

    ctx.fillStyle = '#1e6fd9';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`剩余雷数 ${MINES}`, canvas.width / 2, 42);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            drawCell(c * CELL_SIZE, r * CELL_SIZE, grid[r][c]);
        }
    }

    if (gameOver || win) {
        ctx.fillStyle = 'rgba(26, 43, 66, 0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(win ? '完美排雷！' : '触雷了', canvas.width / 2, canvas.height / 2);
        ctx.font = '14px sans-serif';
        ctx.fillText('按 R 重新开始', canvas.width / 2, canvas.height / 2 + 36);
    }

    requestAnimationFrame(draw);
}

function reveal(r, c) {
    if (!grid[r] || !grid[r][c] || grid[r][c].revealed || grid[r][c].flagged) return;
    grid[r][c].revealed = true;
    if (grid[r][c].mine) { gameOver = true; return; }
    if (grid[r][c].count === 0) {
        for (let i = -1; i <= 1; i++)
            for (let j = -1; j <= 1; j++) reveal(r + i, c + j);
    }
    checkWin();
}

canvas.addEventListener('mousedown', e => {
    if (gameOver || win) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left - OFFSET_X;
    const my = e.clientY - rect.top - OFFSET_Y;
    const c = Math.floor(mx / CELL_SIZE);
    const r = Math.floor(my / CELL_SIZE);
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        if (e.button === 0) reveal(r, c);
        else if (e.button === 2) grid[r][c].flagged = !grid[r][c].flagged;
    }
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('keydown', e => {
    if (e.key === 'r' || e.key === 'R') initMines();
});

function checkWin() {
    if (grid.every(row => row.every(cell => cell.mine || cell.revealed))) {
        win = true;
        fetch('/api/save_score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game: 'minesweeper', score: timeSec })
        });
    }
}

window.getLeaveGameScore = function () {
    if (win) return { game: 'minesweeper', score: timeSec };
    return null;
};

initMines();
draw();
