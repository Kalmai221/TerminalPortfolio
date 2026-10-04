import os
from flask import Flask, render_template

# Static files live in /public/static, outside /api. Vercel turns every .js/.py file under /api into its own
# serverless function (Hobby plan limit: 12), and serves /public straight from its CDN. Flask only serves them
# itself when running locally (`python api/index.py`).
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(
    __name__,
    static_folder=os.path.join(ROOT, 'public', 'static'),
    static_url_path='/static',
)


@app.route('/')
def index():
    return render_template('index.html')


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
