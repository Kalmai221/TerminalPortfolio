# KalOS Terminal Portfolio

## Overview

KalOS Terminal Portfolio is a retro-style terminal portfolio website that simulates a Linux terminal environment. The application features a boot sequence animation and an interactive command-line interface where visitors can explore professional information through terminal commands like `whoami`, `skills`, `experience`, and `contact`.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Vanilla JavaScript**: No frontend frameworks - uses pure JavaScript ES6 modules for terminal interaction and command execution
- **Dynamic Command Loading**: Commands are loaded as ES6 modules from `/static/js/commands/` directory, enabling hot-reloading and easy extensibility
- **Terminal Emulation**: Custom terminal implementation with cursor animation, command history (up/down arrow navigation), and input handling

### Backend Architecture
- **Flask (Python)**: Lightweight Python web framework serving as the backend
- **Single Entry Point**: `api/index.py` handles all routes with minimal endpoints:
  - `/` - Serves the main terminal HTML page
  - `/commands_list` - Returns JSON array of available commands by scanning the commands directory
- **Template Rendering**: Uses Jinja2 templates via Flask's `render_template`

### Command System Design
- **Modular Pattern**: Each command is a separate JavaScript module exporting a default function
- **Auto-Discovery**: Backend scans the `commands/` directory to build the available commands list
- **Easy Extension**: Add new commands by creating a new `.js` file in `api/static/js/commands/`

### Deployment Architecture
- **Vercel-Ready**: Configured with `vercel.json` for serverless deployment
- **URL Rewriting**: All routes redirect to `/api/index` for Flask handling

## External Dependencies

### Python Dependencies
- **Flask**: Web framework (defined in `requirements.txt`)

### Frontend Dependencies
- **Ubuntu Mono Font**: Terminal-style typography (loaded via system fonts)
- **Vercel Analytics**: Optional analytics integration via `/_vercel/insights/script.js`

### External Services
- **Vercel**: Primary deployment platform with serverless function support
- **GitHub**: Source code hosting and linked from the portfolio interface

### Browser Site Feature
- **Simulated Browser**: The `browser.js` module simulates package installation and browser launching for an embedded "mywork" showcase page
- **Static HTML Sites**: Located in `api/static/browsersites/` for browser simulation feature