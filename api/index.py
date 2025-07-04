import os
from flask import Flask, render_template, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/commands_list')
def commands_list():
    commands_dir = os.path.join(app.static_folder, 'js', 'commands')
    files = os.listdir(commands_dir)
    commands = [f[:-3] for f in files if f.endswith('.js')]
    return jsonify(commands)

if __name__ == "__main__":
    app.run(debug=True)
