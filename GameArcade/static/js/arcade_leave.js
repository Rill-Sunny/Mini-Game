/** 返回大厅：视为结束本局并尝试更新最高纪录 */
async function postSaveScore(game, score) {
    await fetch('/api/save_score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, score })
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn-return-lobby').forEach(link => {
        link.addEventListener('click', async e => {
            e.preventDefault();
            if (typeof window.getLeaveGameScore === 'function') {
                const payload = window.getLeaveGameScore();
                if (payload && payload.score != null) {
                    await postSaveScore(payload.game, payload.score);
                }
            }
            window.location.href = '/';
        });
    });
});
