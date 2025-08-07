
# KalOS Terminal Portfolio

A retro-style terminal portfolio website built with Flask that simulates a Linux terminal environment. Features a boot sequence animation and interactive command-line interface to explore my professional background.

## 🚀 Features

- **Boot Sequence**: Realistic system startup animation
- **Interactive Terminal**: Command-line interface with command history
- **Dynamic Commands**: Modular command system with easy extensibility
- **Responsive Design**: Works on desktop and mobile devices
- **GitHub Integration**: Direct link to source code

## 🛠️ Tech Stack

- **Backend**: Flask (Python)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Ubuntu Mono font, terminal-inspired dark theme
- **Deployment**: Vercel-ready configuration

## 📁 Project Structure

```
├── api/
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css          # Terminal styling
│   │   └── js/
│   │       ├── commands/          # Command modules
│   │       │   ├── whoami.js      # About information
│   │       │   ├── skills.js      # Technical skills
│   │       │   ├── experience.js  # Work experience
│   │       │   ├── education.js   # Educational background
│   │       │   ├── pastwork.js    # Previous projects
│   │       │   ├── contact.js     # Contact information
│   │       │   └── ls.js          # List commands
│   │       └── terminal.js        # Main terminal logic
│   ├── templates/
│   │   └── index.html             # Main page template
│   └── index.py                   # Flask application
├── requirements.txt               # Python dependencies
├── vercel.json                   # Vercel deployment config
└── .replit                       # Replit configuration
```

## 🎮 Available Commands

- `whoami` - Display personal information
- `skills` - Show technical skills and proficiency
- `experience` - Work experience and current status
- `education` - Educational background
- `pastwork` - Previous projects and portfolio
- `contact` - Contact information and availability
- `ls` - List all available commands
- `help` - Show available commands
- `clear` - Clear the terminal screen

## 🏃‍♂️ Running Locally

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the application:**
   ```bash
   python api/index.py
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5000`

## 🔧 Adding New Commands

1. Create a new JavaScript file in `api/static/js/commands/`
2. Export a default function that returns a string:
   ```javascript
   export default function mycommand() {
     return "Your command output here";
   }
   ```
3. The command will be automatically available in the terminal

## 🎨 Customization

- **Boot Sequence**: Edit the `bootSequence` array in `terminal.js`
- **Styling**: Modify `style.css` for colors and layout
- **Commands**: Add/edit command files in the `commands/` directory
- **Personal Info**: Update command files with your information

## 📦 Deployment

### Vercel
This project is configured for Vercel deployment:
1. Connect your GitHub repository to Vercel
2. Deploy automatically on push to main branch

### Replit
1. Import the project to Replit
2. Run using the configured `.replit` file
3. Use Replit's deployment features for hosting

## 🤝 Contributing

Feel free to fork this project and customize it for your own portfolio! If you have suggestions or improvements, please open an issue or submit a pull request.

## 📄 License

This project is open source and available under the MIT License.

## 📧 Contact

- **Email**: Kal@roschol.uk
- **GitHub**: [@Kalmai221](https://github.com/Kalmai221)
- **Location**: United Kingdom (BST/GMT+1)

---

*Built with ❤️ by Kal - A retro terminal experience for the modern web*
