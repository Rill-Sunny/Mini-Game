const canvas = document.getElementById('game2048Canvas');
const ctx = canvas.getContext('2d');

let board = Array(4).fill().map(() => Array(4).fill(0));
let score = 0;
let isOver = false;

const BOARD_BG = '#bbada0';
const EMPTY_CELL = '#cdc1b4';

const TILE_COLORS = {
    0: EMPTY_CELL,
    2: '#eee4da', 4: '#ede0c8',
    8: '#f2b179', 16: '#f59563',
    32: '#f67c5f', 64: '#f65e3b',
    128: '#edcf72', 256: '#edcc61',
    512: '#edc850', 1024: '#edc53f',
    2048: '#edc22e'
};

const TILE_TEXT = {
    light: '#776e65',
    dark: '#f9f6f2'
};

function initGame() {
    board = Array(4).fill().map(() => Array(4).fill(0));
    score = 0;
    isOver = false;
    generateTile();
    generateTile();
}

function generateTile() {
    const empty = [];
    for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++)
            if (board[r][c] === 0) empty.push({ r, c });
    if (empty.length > 0) {
        const cell = empty[Math.floor(Math.random() * empty.length)];
        board[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
    }
}

function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function draw() {
    ctx.fillStyle = '#faf8ef';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1a2b42';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`得分 ${score}`, 20, 42);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#1e6fd9';
    ctx.fillText(`最高 ${BEST_SCORE ? BEST_SCORE : '暂无最高纪录'}`, canvas.width - 20, 42);

    const size = 100;
    const gap = 12;
    const ox = 20;
    const oy = 72;

    roundRect(ox, oy, 460, 460, 10);
    ctx.fillStyle = BOARD_BG;
    ctx.fill();

    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const val = board[r][c];
            const x = ox + gap + c * (size + gap);
            const y = oy + gap + r * (size + gap);

            roundRect(x, y, size, size, 6);
            ctx.fillStyle = TILE_COLORS[val] || '#3c3a32';
            ctx.fill();

            if (val > 0) {
                const useDark = val <= 4;
                ctx.fillStyle = useDark ? TILE_TEXT.light : TILE_TEXT.dark;
                ctx.font = val >= 1000 ? 'bold 26px sans-serif' : 'bold 32px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(val, x + size / 2, y + size / 2);
            }
        }
    }

    if (isOver) {
        ctx.fillStyle = 'rgba(26, 43, 66, 0.55)';
        roundRect(ox, oy, 460, 460, 10);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('游戏结束', canvas.width / 2, oy + 230);
        ctx.font = '16px sans-serif';
        ctx.fillText('按 R 重新开始', canvas.width / 2, oy + 280);
    }

    requestAnimationFrame(draw);
}

function slide(row) {
    let arr = row.filter(val => val);
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            score += arr[i];
            arr[i + 1] = 0;
        }
    }
    arr = arr.filter(val => val);
    while (arr.length < 4) arr.push(0);
    return arr;
}

function rotate() {
    const newData = Array(4).fill().map(() => Array(4).fill(0));
    for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++) newData[c][3 - r] = board[r][c];
    board = newData;
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        initGame();
        return;
    }
    if (isOver) return;

    const prev = JSON.stringify(board);

    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        board = board.map(row => slide(row));
    } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        board = board.map(row => slide(row.reverse()).reverse());
    } else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        rotate(); rotate(); rotate();
        board = board.map(row => slide(row));
        rotate();
    } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        rotate();
        board = board.map(row => slide(row));
        rotate(); rotate(); rotate();
    }

    if (JSON.stringify(board) !== prev) {
        generateTile();
        checkGameOver();
    }
});

function checkGameOver() {
    for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++) {
            if (board[r][c] === 0) return;
            if (r < 3 && board[r][c] === board[r + 1][c]) return;
            if (c < 3 && board[r][c] === board[r][c + 1]) return;
        }
    isOver = true;
    fetch('/api/save_score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game: 'game_2048', score: score })
    });
}

window.getLeaveGameScore = function () {
    isOver = true;
    return { game: 'game_2048', score };
};

initGame();
draw();
