import json
import os
import socket
from flask import Flask, render_template, request, jsonify

_fqdn = socket.getfqdn


def _patched_getfqdn(name=''):
    try:
        return _fqdn(name)
    except UnicodeDecodeError:
        return name or 'localhost'


socket.getfqdn = _patched_getfqdn

app = Flask(__name__)

SAVE_FILE = 'save.json'


def default_records():
    return {
        "game_2048": {"best_score": 0},
        "tetris": {"best_score": 0},
        "snake": {"best_score": 0},
        "minesweeper": {"best_time": None},
    }


def load_records():
    """读取本地最高纪录存档，并与默认结构合并"""
    defaults = default_records()
    if not os.path.exists(SAVE_FILE):
        with open(SAVE_FILE, 'w', encoding='utf-8') as f:
            json.dump(defaults, f, ensure_ascii=False, indent=4)
        return defaults

    try:
        with open(SAVE_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except (json.JSONDecodeError, KeyError, IndexError):
        return defaults

    data.pop('sudoku', None)
    merged = default_records()
    for game, fields in merged.items():
        saved = data.get(game)
        if isinstance(saved, dict):
            merged[game].update(saved)
        elif saved is not None:
            merged[game] = saved
    return merged


def save_records(records):
    """保存最高纪录到本地"""
    clean = load_records()
    clean.pop('sudoku', None)
    for game in default_records():
        if game in records:
            if isinstance(records[game], dict) and isinstance(clean.get(game), dict):
                clean[game].update(records[game])
            else:
                clean[game] = records[game]
    with open(SAVE_FILE, 'w', encoding='utf-8') as f:
        json.dump(clean, f, ensure_ascii=False, indent=4)


def format_best_time(seconds):
    if seconds is None:
        return '暂无最高纪录'
    minutes, secs = divmod(int(seconds), 60)
    return f'{minutes:02d}:{secs:02d}'


def format_best_score(score):
    if score is None or score == 0:
        return '暂无最高纪录'
    return f'{score} 分'


@app.context_processor
def inject_formatters():
    return dict(fmt_time=format_best_time, fmt_score=format_best_score)


# --- 页面路由 ---
@app.route('/')
def index():
    return render_template('index.html', records=load_records(), active_page='index')


@app.route('/2048')
def game_2048():
    return render_template('game2048.html', records=load_records(), active_page='game2048')


@app.route('/tetris')
def tetris():
    return render_template('tetris.html', records=load_records(), active_page='tetris')


@app.route('/snake')
def snake():
    return render_template('snake.html', records=load_records(), active_page='snake')


@app.route('/minesweeper')
def minesweeper():
    return render_template('minesweeper.html', records=load_records(), active_page='minesweeper')


# --- 存档 API 接口 ---
@app.route('/api/save_score', methods=['POST'])
def save_score():
    data = request.json
    game = data.get('game')
    score = data.get('score')

    records = load_records()
    updated = False

    if game == 'game_2048':
        if score > records['game_2048']['best_score']:
            records['game_2048']['best_score'] = score
            updated = True
    elif game == 'tetris':
        if score > records['tetris']['best_score']:
            records['tetris']['best_score'] = score
            updated = True
    elif game == 'snake':
        if score > records['snake']['best_score']:
            records['snake']['best_score'] = score
            updated = True
    elif game == 'minesweeper':
        if records['minesweeper']['best_time'] is None or score < records['minesweeper']['best_time']:
            records['minesweeper']['best_time'] = score
            updated = True

    if updated:
        save_records(records)
        return jsonify({"status": "success", "message": "新纪录已保存！"})
    return jsonify({"status": "ignored", "message": "未超越历史纪录。"})


if __name__ == '__main__':
    app.run(host='127.0.0.1', debug=True, use_reloader=False, port=5000)
