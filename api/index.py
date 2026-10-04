import os
from flask import Flask, render_template, request

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.after_request
def cache_static(resp):
    # On Vercel only: let the CDN cache static assets (per deployment) so they don't invoke the function on every
    # request. Browsers always revalidate, so a new deploy or a local edit is never served stale.
    if os.environ.get('VERCEL') and request.path.startswith('/static/') and resp.status_code == 200:
        resp.headers['Cache-Control'] = 'public, max-age=0, must-revalidate, s-maxage=86400'
    return resp


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
