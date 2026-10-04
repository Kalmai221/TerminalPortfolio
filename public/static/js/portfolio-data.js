// portfolio-data.js - the portfolio content, copied from https://klhportfolio.vercel.app.
// One source of truth for `portfolio --cli`, `portfolio --tui` and the files in the virtual filesystem.

export const SITE = "https://klhportfolio.vercel.app";

export const PERSON = {
    name: "Kurtis-Lee Hopewell",
    location: "Coventry, West Midlands, UK",
    headline: "Pearson BTEC Level 3 IT graduate (DDD) and self-taught developer",
    summary: "I'm a Pearson BTEC Level 3 IT graduate (DDD) from Coventry, UK, and a self-taught developer. I like backend work, automation and the infrastructure underneath it, and I've spent time on the IT team of a national engineering project.",
    looking: "I'm looking for a higher or degree apprenticeship starting September 2026, and I'm happy to talk about junior IT and development roles too.",
    available: "Available from September 2026.",
    reply: "I usually reply within one or two working days.",
    email: "hkurtislee@outlook.com",
    github: "https://github.com/Kalmai221",
    linkedin: "https://www.linkedin.com/in/kurtishopewell/",
    outside: "I build small serverless systems with Flask and MongoDB Atlas, run a Linux homelab, and keep learning network design and security by breaking things at home first.",
};

export const EDUCATION = [
    { school: "Coventry College", years: "2024 to 2026", title: "BTEC Level 3 National Extended Diploma in IT", result: "Distinction, Distinction, Distinction (DDD)" },
    { school: "Westwood Academy", years: "2019 to 2024", title: "9 GCSEs", result: "Grades 7 to 3" },
    { school: "Cisco Networking Academy", years: "", title: "Networking Basics and Introduction to Cybersecurity", result: "" },
];

// Grades page. `status` is "Predicted" for grades that are only predicted, "Grade" for achieved ones (both years are achieved now).
export const GRADES = {
    updated: "30 September 2026",
    qualification: "BTEC Level 3 National Extended Diploma in IT",
    overall: "Distinction, Distinction, Distinction (DDD)",
    years: [
        {
            year: "Year 2", status: "Grade", units: [
                { name: "The Internet of Things", kind: "Assignment", grade: "Distinction", blurb: "Researching and building connected systems that use sensors and automation.", parts: [["19.1 Examine IoT Systems", "Distinction"], ["19.2 Design & Develop Prototype", "Distinction"]] },
                { name: "Mobile Apps Development", kind: "Assignment", grade: "Merit", blurb: "Building a mobile app from market research through to a working release.", parts: [["7.1 Investigating Mobile Apps", "Distinction"], ["7.2 Design & Develop", "Merit"]] },
                { name: "IT Project Management", kind: "Assignment", grade: "Distinction", blurb: "Running a simulated project: resources, timelines and technical documentation.", parts: [["9.1 Investigating PM", "Distinction"], ["9.2 PM in Action", "Distinction"], ["9.3 Project Evaluation", "Distinction"]] },
                { name: "Cyber Security & Incident Management", kind: "Exam", grade: "Merit", blurb: "Encryption, firewalls, recovery procedures and protecting digital assets.", parts: [["Digital Security Exam", "Merit"]] },
                { name: "Software Testing", kind: "Assignment", grade: "Distinction", blurb: "Quality assurance, including unit testing and user acceptance testing (UAT).", parts: [["13.1 Testing Methodologies", "Distinction"], ["13.2 Software Test Execution", "Distinction"]] },
                { name: "IT Technical Support & Management", kind: "Assignment", grade: "Merit", blurb: "Troubleshooting enterprise systems and managing hardware and software life cycles.", parts: [["12.1 Examining IT Support", "Merit"], ["12.2 Managing Systems", "Distinction"]] },
                { name: "IT Service Delivery", kind: "Exam", grade: "Merit", blurb: "Matching IT services to business needs through planning and resource management.", parts: [["IT Service Delivery Exam", "Merit"]] },
            ],
        },
        {
            year: "Year 1", status: "Grade", units: [
                { name: "Programming", kind: "Assignment", grade: "Distinction", blurb: "Foundational software development in Python, covering data types and functional programming.", parts: [["4.1 Concepts of Programming", "Distinction"], ["4.2 Design & Develop a Software Solution", "Distinction"]] },
                { name: "Creating Systems to Manage Information", kind: "Exam", grade: "Distinction", blurb: "Relational database design, normalisation and SQL, assessed through a set task.", parts: [["2.1 Set Task (Exam Conditions)", "Distinction"]] },
                { name: "Website Development", kind: "Assignment", grade: "Distinction", blurb: "Front-end development with HTML5 and CSS3, focusing on responsive design.", parts: [["6.1 Website Evaluation", "Distinction"], ["6.2 Design & Develop a Website", "Distinction"]] },
                { name: "Information Technology Systems", kind: "Exam", grade: "Pass", blurb: "Hardware, software, networking and data security theory.", parts: [["1.1 Computer Systems Exam", "Pass"]] },
                { name: "Data Modelling", kind: "Assignment", grade: "Merit", blurb: "Using spreadsheets and modelling software to analyse complex data sets.", parts: [["5.1 Models & Decision Making", "Merit"], ["5.2 Design, Create & Evaluate", "Distinction"]] },
                { name: "Using Social Media in Business", kind: "Assignment", grade: "Pass", blurb: "Digital marketing and how social media affects business communication.", parts: [["3.1 Evaluating Social Media Use", "Distinction"], ["3.2 Social Media Plan", "Pass"]] },
            ],
        },
    ],
    gcse: "Westwood Academy: 9 GCSEs, graded 9 to 1 (grades 7 to 3).",
};

export const EXPERIENCE = [
    { role: "Front of House Staff", org: "Town Crier, Coventry", when: "Feb 2026 to present", points: [
        "Run the floor at high-volume events, including bar restocking and looking after guests.",
        "Coordinate with the rest of the team so service stays smooth when it gets busy.",
    ] },
    { role: "IT Work Experience", org: "Balfour Beatty VINCI, HS2 project", when: "Apr 2025 and Mar to Apr 2026", points: [
        "Diagnosed and fixed system access problems that followed Microsoft security policy updates.",
        "Wrote technical documentation and reviewed how enterprise data moves between Visio and SharePoint.",
        "Built IT health reports in Power BI and supported infrastructure standards on a national engineering project.",
    ] },
    { role: "Newspaper Delivery", org: "Premier Store", when: "Nov 2024 to Jun 2026", points: [
        "Kept a 100% reliability record on early-morning routes while studying full time.",
    ] },
];

export const SKILLS = [
    { name: "Python and Flask", level: "Daily use", note: "Backend logic and automation. This site's CMS is written in it." },
    { name: "HTML and CSS", level: "Daily use", note: "Responsive, accessible interfaces." },
    { name: "MongoDB and Vercel", level: "Regular use", note: "Aggregation queries and serverless deployment." },
    { name: "Networking and security", level: "Foundations", note: "Cisco Networking Academy coursework." },
];

export const PROJECTS = [
    {
        name: "Portfolio CMS", tagline: "The site you're on", status: "Live",
        text: "I wanted to change my portfolio without redeploying it, so I built a small CMS. Pages are stored in MongoDB and served by Flask on Vercel, and I edit them from an editor in the browser.",
        points: [
            "In-browser editor with a live preview and an audit log of every change.",
            "Visitor analytics that don't store IP addresses or use cookies.",
            "A public sandbox where anyone can try the editor. It runs entirely in their own browser, so nothing they write reaches my server.",
            "Maintenance mode for the whole site or a single page.",
        ],
        tags: ["Python", "Flask", "MongoDB Atlas", "Vercel"],
        links: [["Try the editor", `${SITE}/trial`], ["Source code", "https://github.com/Kalmai221/portfolio"]],
    },
    {
        name: "Terminal Portfolio", tagline: "This portfolio, as a Linux terminal", status: "Live",
        text: "A terminal-style version of my portfolio that runs in the browser. It simulates a Linux shell with a virtual filesystem, pipes and tab completion, boots like a real machine, and has a built-in browser with developer tools and a full-screen text interface. Flask serves the page and Vercel serves everything else as static files.",
        points: [
            "A simulated bash shell: ls, cat, grep, man and more, working on a virtual filesystem.",
            "A built-in browser with tabs, bookmarks and developer tools.",
            "The portfolio command shows this portfolio in the terminal, a text interface or the browser.",
            "Vanilla JavaScript, with no frameworks.",
        ],
        tags: ["Python", "Flask", "JavaScript", "Vercel"],
        links: [["Open the terminal", "https://klhterminalportfolio.vercel.app"], ["Source code", "https://github.com/Kalmai221/TerminalPortfolio"]],
    },
    {
        name: "Flask Profiler (fork)", tagline: "Request timing for Flask apps", status: "On PyPI",
        text: "A fork of the Flask profiling library, published to PyPI. It records how often each endpoint is called and how long requests take, so slow routes are easy to find.",
        points: [],
        tags: ["Python", "Flask", "PyPI"],
        links: [["View on PyPI", "https://pypi.org/project/Flask-ProfilerForked/"], ["Source code", "https://github.com/Kalmai221/FlaskProfilerForked"]],
    },
    {
        name: "PythonOS", tagline: "A tiny operating system, in Python", status: "In progress",
        text: "A command-line environment written in plain Python. I built it to learn how a shell works: parsing commands, managing a file structure and running processes in a loop.",
        points: [],
        tags: ["Python 3"],
        links: [["View repository", "https://github.com/Kalmai221/PythonOS"]],
    },
];

export const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Plain-text versions (used for the files in the virtual filesystem) */
export function plainText(section, arg) {
    const wrap = (s, w = 76) => s.replace(new RegExp(`(.{1,${w}})(\\s+|$)`, "g"), "$1\n").trimEnd();
    switch (section) {
        case "about":
            return `${PERSON.name}\n${PERSON.location}\n\n${wrap(PERSON.summary)}\n\n${wrap(PERSON.outside)}`;
        case "education":
            return EDUCATION.map((e) => `${e.school}${e.years ? `, ${e.years}` : ""}\n  ${e.title}${e.result ? `\n  ${e.result}` : ""}${e.note ? `\n  (${e.note})` : ""}`).join("\n\n");
        case "grades":
            return [`${GRADES.qualification}`, `Overall: ${GRADES.overall}`, `Last updated ${GRADES.updated}`, "",
                ...GRADES.years.flatMap((y) => [`${y.year} (${y.status === "Predicted" ? "predicted" : "achieved"})`,
                    ...y.units.map((u) => `  ${u.grade.padEnd(12)}${u.name} (${u.kind.toLowerCase()})`), ""]),
                GRADES.gcse].join("\n");
        case "experience":
            return EXPERIENCE.map((x) => `${x.role} - ${x.org} (${x.when})\n${x.points.map((p) => `  - ${p}`).join("\n")}`).join("\n\n");
        case "skills":
            return SKILLS.map((s) => `${s.name.padEnd(24)}${s.level.padEnd(13)}${s.note}`).join("\n");
        case "contact":
            return `Email:    ${PERSON.email}\nGitHub:   ${PERSON.github}\nLinkedIn: ${PERSON.linkedin}\nWebsite:  ${SITE}\nBased in: ${PERSON.location}\n\n${wrap(PERSON.looking)}\n${PERSON.available}\n${PERSON.reply}`;
        case "project": {
            const p = PROJECTS.find((x) => slug(x.name) === arg);
            if (!p) return "";
            return `${p.name} (${p.status})\n${p.tagline}\n\n${wrap(p.text)}\n${p.points.length ? "\n" + p.points.map((x) => `  - ${x}`).join("\n") + "\n" : ""}\nStack: ${p.tags.join(", ")}\n${p.links.map(([l, u]) => `${l}: ${u}`).join("\n")}`;
        }
        default:
            return "";
    }
}
