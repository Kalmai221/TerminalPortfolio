import os
from flask import Blueprint, render_template, jsonify

# 1. Create the Blueprint object
# We explicitly define the static and template folders relative to this file
portfolio_bp = Blueprint(
    'portfolio', 
    __name__, 
    static_folder='static', 
    template_folder='templates'
)

@portfolio_bp.route('/')
def index():
    # Note: If your main app also has an 'index.html', this might conflict.
    # It is often safer to rename the blueprint template to 'portfolio_index.html'
    return render_template('index.html')

@portfolio_bp.route('/commands_list')
def commands_list():
    # 2. Use the blueprint's specific static_folder attribute
    # This ensures it looks in the portfolio's static folder, not the main app's
    commands_dir = os.path.join(portfolio_bp.static_folder, 'js', 'commands')
    
    try:
        files = os.listdir(commands_dir)
        commands = [f[:-3] for f in files if f.endswith('.js')]
        return jsonify(commands)
    except FileNotFoundError:
        return jsonify({"error": "Commands directory not found"}), 404
