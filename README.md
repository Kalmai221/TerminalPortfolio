# 🖥️ Terminal Portfolio

![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.9+-blue)
![Flask](https://img.shields.io/badge/backend-Flask-black)
![Vercel](https://img.shields.io/badge/deploy-Vercel-white)

> **Live terminal:** [klhterminalportfolio.vercel.app](https://klhterminalportfolio.vercel.app)  
> Companion to the main portfolio at [klhportfolio.vercel.app](https://klhportfolio.vercel.app).

A fully interactive, retro-styled operating system simulation built for the modern web. This project is the terminal-style portfolio of Kurtis-Lee Hopewell, presenting education, work experience, skills and projects through a Linux-like terminal interface and a simulated GUI browser.

## ✨ Key Features

### 📟 The Terminal Core
- **Realistic Boot Sequence:** System checks, service startups, and kernel logging animations.
- **Command Registry System:** A scalable architecture for handling commands without server overload.
- **Tab Completion & History:** Arrow keys and Tab support for a native shell feel.
- **Mobile Optimized:** Custom virtual keyboard handling and responsive layout.

### 🌐 Simulated Browser GUI
- **In-Terminal Browser:** `portfolio` simulates an apt install and a browser boot, then open a tabbed browser with working back/forward, bookmarks, settings and a new-tab page.
- **Tabbed Navigation:** Manage multiple "sites" within the portfolio.
- **Developer Tools (F12):** Elements (live DOM tree, editable styles, element picker), Console (run JS in the page), Sources, Network and Application panels. Cross-origin pages like the embedded portfolio can't be inspected, and the panels say so.
- **Browser features:** tabs with context menus, bookmarks, history, find in page, zoom, view-source, an address-bar dropdown and keyboard shortcuts (see `browser://about`).
- **CLI to GUI transition:** launching the browser fades the terminal into a small desktop with a dock; closing it plays the reverse and returns to the shell.
- **System Settings:** Real-time toggles for **Dark Mode**, **High Contrast**, and **Font Sizing**.
- **Offline Dino Game:** A pixel-art recreation of the "No Internet" game, shown when you visit an address the browser can't reach.

## 🛠️ Tech Stack

* **Backend:** Python (Flask) - Serves the shell and API routes.
* **Frontend:** Vanilla JavaScript (ES6+), HTML5.
* **Styling:** CSS3 Variables (Theming), Flexbox, CSS Grid.
* **Typography:** Fira Code & Ubuntu Mono via Google Fonts.
* **Performance:** Zero-dependency rendering engine; highly optimized for Vercel Free Tier.

## 📁 Project Structure

```text
├── api/
│   ├── index.py              # Flask app (serves the page; static files in local dev only)
│   └── templates/
│       └── index.html        # Main Entry DOM
├── public/                   # Served straight from Vercel's CDN (not serverless functions)
│   └── static/
│       ├── css/style.css     # Unified CSS (Terminal + Browser + Boot + TUI)
│       ├── browsersites/     # Pages shown in the built-in browser (new tab, offline...)
│       └── js/
│           ├── terminal.js       # Core shell logic & input handling
│           ├── shell.js          # Virtual filesystem & built-in commands
│           ├── docs.js           # help / man page text
│           ├── boot.js           # Simulated Linux boot sequence
│           ├── transition.js     # CLI <-> GUI hand-off animation
│           ├── browser.js        # KLH Browser
│           ├── devtools.js       # Developer tools panel
│           ├── launcher.js       # Browser install + boot simulation
│           ├── tui.js            # Full-screen text interface (portfolio --tui)
│           ├── portfolio-cli.js  # Terminal copy of the portfolio (portfolio --cli)
│           ├── portfolio-data.js # Portfolio content shared by the CLI, TUI and files
│           └── commands/         # portfolio.js, reboot.js
├── vercel.json               # Rewrites everything else to the Flask app
└── requirements.txt          # Python Dependencies
```

## 🎮 Command List

| Command | Description |
| --- | --- |
| `profile --help` | Shows flags to filter data (e.g., `profile --skills`). |
| `portfolio` | Pick how to view my portfolio: `--cli` (terminal output), `--tui` (full-screen text UI) or `--web` (built-in browser). With no option, an interactive picker asks. `--web --external` opens a real browser tab. |
| `settings` | Opens the System Settings UI. |
| `ls`, `cd`, `cat`, `tree`, `pwd` | Browse a virtual filesystem in `~` (about.txt, projects/, ...). |
| `neofetch`, `uname`, `whoami`, `date`, `ps`, `df`, `free` | Familiar system info commands. |
| `grep`, `head`, `tail`, `wc`, `sort` | Text tools that work on files or on piped input (`cat skills.txt \| grep -i python`). |
| `help`, `help <cmd>`, `<cmd> --help`, `man <cmd>` | Bash-style help and man pages. |
| `clear` | Clears the terminal buffer. |
| `reboot` | Triggers a full system restart animation. |

## 🚀 Getting Started

### Prerequisites

* Python 3.9+
* pip

### Installation

1. **Clone the repository:**
```bash
git clone [https://github.com/Kalmai221/TerminalPortfolio.git](https://github.com/Kalmai221/TerminalPortfolio.git)
cd TerminalPortfolio

```


2. **Install dependencies:**
```bash
pip install -r requirements.txt

```


3. **Run locally:**
```bash
python api/index.py

```


4. **Access:**
Open `http://localhost:5000` in your browser.

## 🔧 Customization Guide

### Editing Portfolio Data

Vercel's Hobby plan allows 12 serverless functions, and every `.js`/`.py` file under `api/` counts as one. That's why the site's JavaScript lives in `public/` and only `api/index.py` is a function. Don't add `.js` or `.py` files under `api/`.

1. **Edit Profile Data:**
* Open `public/static/js/portfolio-data.js`.
* Edit the data (person, education, grades, experience, skills, projects). `portfolio --cli`, `portfolio --tui` and the files shown by `ls`/`cat` all read from it.


2. **Edit Browser Projects:**
* The browser shows the live portfolio (https://klhportfolio.vercel.app) in an iframe. The built-in pages (new tab, offline) are in `public/static/browsersites/`.


3. **Styling:**
* Theme variables (Colors, Fonts) are defined in `:root` inside `style.css`.



## 📦 Deployment

### Vercel (Recommended)

This project is optimized for Vercel's serverless architecture.

1. Fork this repo.
2. Import to Vercel.
3. The `vercel.json` file handles the Python runtime configuration automatically.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
Built with ❤️ by <a href="https://github.com/Kalmai221">Kurtis-Lee Hopewell</a>
<i>Terminals never die, they just go offline.</i>
</div>