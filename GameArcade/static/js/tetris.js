const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');

const COLS = 10, ROWS = 20, BLOCK_SIZE = 30;
const OFFSET_X = 30, OFFSET_Y = 30;
const PREVIEW_X = 358, PREVIEW_Y = 138, PREVIEW_CELL = 20;

let arena = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let score = 0, gameOver = false;

const PIECE_COLORS = [
    null,
    '#00d4ff', // I
    '#a855f7', // T
    '#ff9f1c', // L
    '#3b82f6', // J
    '#ffd60a', // O
    '#ef4444', // Z
    '#22c55e'  // S
];

const SHAPES = [
    [],
    [[1, 1, 1, 1]],
    [[1, 1, 1], [0, 1, 0]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[1, 1], [1, 1]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]]
];

let player = { pos: { x: 0, y: 0 }, matrix: null, id: 1 };
let nextPiece = null;

function cloneMatrix(m) {
    return m.map(row => [...row]);
}

function createPiece() {
    const id = Math.floor(Math.random() * 7) + 1;
    return { id, matrix: cloneMatrix(SHAPES[id]) };
}

function drawBlock(x, y, color, alpha = 1) {
    const px = OFFSET_X + x * BLOCK_SIZE;
    const py = OFFSET_Y + y * BLOCK_SIZE;
    const s = BLOCK_SIZE - 2;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, s, s);

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(px + 1, py + 1, s, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(px + 1, py + s - 3, s, 3);
    ctx.globalAlpha = 1;
}

function drawPreviewBlock(px, py, color) {
    const s = PREVIEW_CELL - 2;
    ctx.fillStyle = color;
    ctx.fillRect(px, py, s, s);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(px, py, s, 3);
}

function resetPlayer() {
    if (nextPiece) {
        player.id = nextPiece.id;
        player.matrix = cloneMatrix(nextPiece.matrix);
    } else {
        const p = createPiece();
        player.id = p.id;
        player.matrix = p.matrix;
    }
    nextPiece = createPiece();
    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);

    if (collide()) {
        gameOver = true;
        fetch('/api/save_score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game: 'tetris', score: score })
        });
    }
}

function collide() {
    const m = player.matrix;
    const o = player.pos;
    for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m[r].length; c++) {
            if (m[r][c] === 0) continue;
            const nr = r + o.y;
            const nc = c + o.x;
            if (nc < 0 || nc >= COLS || nr >= ROWS) return true;
            if (nr >= 0 && arena[nr][nc] !== 0) return true;
        }
    }
    return false;
}

function merge() {
    player.matrix.forEach((row, r) => {
        row.forEach((value, c) => {
            if (value !== 0) arena[r + player.pos.y][c + player.pos.x] = player.id;
        });
    });
}

function sweep() {
    outer: for (let r = ROWS - 1; r >= 0; r--) {
        for (let c = 0; c < COLS; c++) if (arena[r][c] === 0) continue outer;
        arena.splice(r, 1);
        arena.unshift(Array(COLS).fill(0));
        r++;
        score += 100;
    }
}

function drop() {
    player.pos.y++;
    if (collide()) {
        player.pos.y--;
        merge();
        resetPlayer();
        sweep();
    }
    dropCounter = 0;
}

function rotateMatrix(m) {
    const rows = m.length;
    const cols = m[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            rotated[c][rows - 1 - r] = m[r][c];
        }
    }
    return rotated;
}

function playerRotate(dir = 1) {
    const prevMatrix = player.matrix;
    const prevX = player.pos.x;
    let rotated = prevMatrix;
    const times = dir > 0 ? 1 : 3;
    for (let i = 0; i < times; i++) rotated = rotateMatrix(rotated);

    player.matrix = rotated;
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
        player.pos.x = prevX + kick;
        if (!collide()) return;
    }
    player.matrix = prevMatrix;
    player.pos.x = prevX;
}

function drawNextPiece() {
    if (!nextPiece) return;

    const matrix = nextPiece.matrix;
    const color = PIECE_COLORS[nextPiece.id];
    const offsetX = PREVIEW_X + Math.floor((4 - matrix[0].length) / 2) * PREVIEW_CELL;
    const offsetY = PREVIEW_Y + Math.floor((4 - matrix.length) / 2) * PREVIEW_CELL;

    matrix.forEach((row, r) => {
        row.forEach((val, c) => {
            if (val) drawPreviewBlock(offsetX + c * PREVIEW_CELL, offsetY + r * PREVIEW_CELL, color);
        });
    });
}

let dropCounter = 0, lastTime = 0;

function update(time = 0) {
    if (gameOver) {
        draw();
        ctx.fillStyle = 'rgba(26, 43, 66, 0.65)';
        ctx.fillRect(OFFSET_X, OFFSET_Y, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', OFFSET_X + COLS * BLOCK_SIZE / 2, OFFSET_Y + ROWS * BLOCK_SIZE / 2);
        ctx.font = '14px sans-serif';
        ctx.fillText('按 R 重新开始', OFFSET_X + COLS * BLOCK_SIZE / 2, OFFSET_Y + ROWS * BLOCK_SIZE / 2 + 36);
        return;
    }
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > 1000) drop();

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.fillStyle = '#f4f8fc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1a2b42';
    ctx.fillRect(OFFSET_X, OFFSET_Y, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const px = OFFSET_X + c * BLOCK_SIZE;
            const py = OFFSET_Y + r * BLOCK_SIZE;
            ctx.fillStyle = (r + c) % 2 === 0 ? '#1e293b' : '#243044';
            ctx.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
        }
    }

    arena.forEach((row, r) => {
        row.forEach((val, c) => {
            if (val) drawBlock(c, r, PIECE_COLORS[val]);
        });
    });

    if (player.matrix) {
        const color = PIECE_COLORS[player.id];
        player.matrix.forEach((row, r) => {
            row.forEach((val, c) => {
                if (val) drawBlock(c + player.pos.x, r + player.pos.y, color);
            });
        });
    }

    ctx.fillStyle = '#1a2b42';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`得分 ${score}`, 360, 50);
    ctx.fillStyle = '#1e6fd9';
    ctx.fillText(`最高 ${BEST_SCORE ? BEST_SCORE : '暂无最高纪录'}`, 360, 85);

    ctx.fillStyle = '#6b7c93';
    ctx.font = '13px sans-serif';
    ctx.fillText('下一块', 360, 125);
    drawNextPiece();
}

function restartGame() {
    arena = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    score = 0;
    gameOver = false;
    nextPiece = null;
    resetPlayer();
    lastTime = 0;
    dropCounter = 0;
    requestAnimationFrame(update);
}

window.addEventListener('keydown', e => {
    if (e.key === 'r' || e.key === 'R') {
        if (gameOver) restartGame();
        return;
    }
    if (gameOver) return;

    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
    }

    if (e.key === 'ArrowLeft') {
        player.pos.x--;
        if (collide()) player.pos.x++;
    } else if (e.key === 'ArrowRight') {
        player.pos.x++;
        if (collide()) player.pos.x--;
    } else if (e.key === 'ArrowDown') {
        drop();
    } else if (e.key === 'ArrowUp') {
        playerRotate(1);
    } else if (e.key === 'z' || e.key === 'Z') {
        playerRotate(-1);
    }
});

window.getLeaveGameScore = function () {
    gameOver = true;
    return { game: 'tetris', score };
};

resetPlayer();
update();
