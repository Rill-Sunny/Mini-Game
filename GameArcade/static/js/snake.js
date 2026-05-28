const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');

const SIZE = 20;
const TOP_BAR = 60;
const GRID_W = canvas.width;
const GRID_H = canvas.height - TOP_BAR;

let snake = [{ x: 200, y: 200 }], food = { x: 0, y: 0 };
let dx = SIZE, dy = 0, score = 0, isOver = false;

function randPiece(max) { return Math.floor(Math.random() * max) * SIZE; }

function placeFood() {
    const cols = GRID_W / SIZE;
    const rows = GRID_H / SIZE;
    let ok = false;
    while (!ok) {
        food.x = randPiece(cols);
        food.y = randPiece(rows);
        ok = !snake.some(p => p.x === food.x && p.y === food.y);
    }
}

function drawGrid() {
    ctx.fillStyle = '#e8f5e9';
    ctx.fillRect(0, TOP_BAR, GRID_W, GRID_H);

    ctx.strokeStyle = 'rgba(34, 139, 58, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_W; x += SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, TOP_BAR);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = TOP_BAR; y <= canvas.height; y += SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GRID_W, y);
        ctx.stroke();
    }
}

function drawSnake() {
    snake.forEach((part, i) => {
        const y = part.y + TOP_BAR;
        if (i === 0) {
            ctx.fillStyle = '#15803d';
            ctx.fillRect(part.x + 1, y + 1, SIZE - 2, SIZE - 2);
            ctx.fillStyle = '#fff';
            ctx.fillRect(part.x + 5, y + 6, 4, 4);
            ctx.fillRect(part.x + 11, y + 6, 4, 4);
        } else {
            const shade = Math.max(0.45, 1 - i * 0.03);
            ctx.fillStyle = `rgba(34, 197, 94, ${shade})`;
            ctx.fillRect(part.x + 2, y + 2, SIZE - 4, SIZE - 4);
        }
    });
}

function drawFood() {
    const y = food.y + TOP_BAR;
    const cx = food.x + SIZE / 2;
    const cy = y + SIZE / 2;

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cx, cy + 2, SIZE / 2 - 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(cx + 4, cy - 6, 5, 3, 0.5, 0, Math.PI * 2);
    ctx.fill();
}

function drawHeader() {
    ctx.fillStyle = '#f4f8fc';
    ctx.fillRect(0, 0, canvas.width, TOP_BAR);

    ctx.fillStyle = '#1a2b42';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`得分 ${score}`, 16, 38);

    ctx.fillStyle = '#1e6fd9';
    ctx.textAlign = 'right';
    ctx.fillText(`最高 ${BEST_SCORE ? BEST_SCORE : '暂无最高纪录'}`, canvas.width - 16, 38);
}

function main() {
    if (isOver) {
        drawHeader();
        drawGrid();
        drawSnake();
        drawFood();
        ctx.fillStyle = 'rgba(26, 43, 66, 0.55)';
        ctx.fillRect(0, TOP_BAR, GRID_W, GRID_H);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', canvas.width / 2, TOP_BAR + GRID_H / 2);
        ctx.font = '14px sans-serif';
        ctx.fillText('按 R 重新开始', canvas.width / 2, TOP_BAR + GRID_H / 2 + 32);
        return;
    }

    setTimeout(() => {
        drawHeader();
        drawGrid();
        drawFood();
        moveSnake();
        drawSnake();
        main();
    }, 120 - Math.min(score, 50));
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (head.x < 0 || head.x >= GRID_W || head.y < 0 || head.y >= GRID_H ||
        snake.some(p => p.x === head.x && p.y === head.y)) {
        isOver = true;
        fetch('/api/save_score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game: 'snake', score: score })
        });
        return;
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        placeFood();
    } else {
        snake.pop();
    }
}

window.addEventListener('keydown', e => {
    if (e.key === 'r' || e.key === 'R') {
        snake = [{ x: 200, y: 200 }];
        dx = SIZE; dy = 0;
        score = 0;
        isOver = false;
        placeFood();
        main();
        return;
    }
    if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -SIZE; }
    else if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = SIZE; }
    else if (e.key === 'ArrowLeft' && dx === 0) { dx = -SIZE; dy = 0; }
    else if (e.key === 'ArrowRight' && dx === 0) { dx = SIZE; dy = 0; }
});

window.getLeaveGameScore = function () {
    isOver = true;
    return { game: 'snake', score };
};

placeFood();
main();
