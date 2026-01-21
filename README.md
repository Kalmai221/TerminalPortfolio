# 🖥️ KalOS Terminal Portfolio

![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.9+-blue)
![Flask](https://img.shields.io/badge/backend-Flask-black)
![Vercel](https://img.shields.io/badge/deploy-Vercel-white)

> **Access the live terminal:** [kalsites.vercel.app/portfolio](https://kalsites.vercel.app/portfolio)

A fully interactive, retro-styled operating system simulation built for the modern web. This project acts as a developer portfolio, presenting professional experience through a Linux-like terminal interface and a simulated GUI browser.

## ✨ Key Features

### 📟 The Terminal Core
- **Realistic Boot Sequence:** System checks, service startups, and kernel logging animations.
- **Command Registry System:** A scalable architecture for handling commands without server overload.
- **Tab Completion & History:** Arrow keys and Tab support for a native shell feel.
- **Mobile Optimized:** Custom virtual keyboard handling and responsive layout.

### 🌐 Simulated Browser GUI
- **In-Terminal Browser:** A `mywork` command launches a CSS/JS-based window manager.
- **Tabbed Navigation:** Manage multiple "sites" within the portfolio.
- **System Settings:** Real-time toggles for **Dark Mode**, **High Contrast**, and **Font Sizing**.
- **Offline Dino Game:** A full HTML5 Canvas pixel-art recreation of the classic "No Internet" game, hidden in 404 pages.

## 🛠️ Tech Stack

* **Backend:** Python (Flask) - Serves the shell and API routes.
* **Frontend:** Vanilla JavaScript (ES6+), HTML5.
* **Styling:** CSS3 Variables (Theming), Flexbox, CSS Grid.
* **Typography:** Fira Code & Ubuntu Mono via Google Fonts.
* **Performance:** Zero-dependency rendering engine; highly optimized for Vercel Free Tier.

## 📁 Project Structure

```text
├── api/
│   ├── index.py              # Flask Application Entry Point
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css     # Unified CSS (Terminal + Browser + Boot)
│   │   ├── js/
│   │   │   ├── browser.js    # Browser Simulation & Dino Game Logic
│   │   │   ├── terminal.js   # Core Shell Logic & Input Handling
│   │   │   └── commands/
│   │   │       └── profile.js # The "Mega Command" (Resume Data)
│   └── templates/
│       └── index.html        # Main Entry DOM
├── vercel.json               # Serverless Configuration
└── requirements.txt          # Python Dependencies

```

## 🎮 Command List

| Command | Description |
| --- | --- |
| `profile` | **The Main Hub.** Displays WhoAmI, Education, Experience, and Skills. |
| `profile --help` | Shows flags to filter data (e.g., `profile --skills`). |
| `mywork` | Launches the **GUI Browser** to view projects. |
| `settings` | Opens the System Settings UI. |
| `ls` | Lists available executable files. |
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

To avoid Vercel function limits, all resume data is consolidated into **Registry Files**.

1. **Edit Profile Data:**
* Open `api/static/js/commands/profile.js`.
* Modify the JSON objects inside `whoami`, `education`, or `experience`.


2. **Edit Browser Projects:**
* Open `api/static/js/browser.js`.
* Locate the `loadInternalPage` function to add new "websites" or projects.


3. **Styling:**
* Theme variables (Colors, Fonts) are defined in `:root` inside `style.css`.



## 📦 Deployment

### Vercel (Recommended)

This project is optimized for Vercel's serverless architecture.

1. Fork this repo.
2. Import to Vercel.
3. The `vercel.json` file handles the Python runtime configuration automatically.

### Replit

1. Import repository.
2. Run using the `.replit` config file.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
Built with ❤️ by <a href="https://github.com/Kalmai221">Kal</a>
<i>Terminals never die, they just go offline.</i>
</div>