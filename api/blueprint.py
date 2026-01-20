import os
from flask import Blueprint, render_template, jsonify

# 1. Get the absolute path to the directory containing this blueprint.py file
# This gives us: C:\...\downloaded_portfolio\api
base_dir = os.path.dirname(os.path.abspath(__file__))

# 2. Build explicit paths to the templates and static folders
template_dir = os.path.join(base_dir, 'templates')
static_dir = os.path.join(base_dir, 'static')

# --- DEBUGGING: Print what Python sees ---
print(f"DEBUG: Blueprint is looking for templates in: {template_dir}")
if os.path.exists(template_dir):
    print(f"DEBUG: Files found in templates: {os.listdir(template_dir)}")
else:
    print("DEBUG: Templates folder NOT FOUND at that path!")
# ---------------------------------------

# 3. Create the Blueprint with explicit absolute paths
portfolio_bp = Blueprint(
    'portfolio', 
    __name__, 
    static_folder=static_dir,
    template_folder=template_dir
)

@portfolio_bp.route('/')
def index():
    return render_template('index.html')

@portfolio_bp.route('/commands_list')
def commands_list():
    # Use the same absolute path logic for the commands folder
    commands_dir = os.path.join(static_dir, 'js', 'commands')
    
    try:
        files = os.listdir(commands_dir)
        commands = [f[:-3] for f in files if f.endswith('.js')]
        return jsonify(commands)
    except FileNotFoundError:
        return jsonify({"error": f"Commands dir not found at {commands_dir}"}), 404
