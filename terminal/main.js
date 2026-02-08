/**
 * Terminal Session — Interactive CLI
 */

(function() {
    'use strict';

    const output = document.getElementById('output');
    const input = document.getElementById('input');
    const terminal = document.getElementById('terminal');

    // Bio data
    const bio = {
        name: 'Phil Komarny',
        title: 'Chief Future Officer @ Maryville University',
        previous: 'Salesforce (VP Innovation), UT System (CDO), Robots & Pencils (CEO)',
        location: 'Crested Butte, CO',
        status: 'Making AI useful since before it was cool',
        email: 'phil@komarny.com'
    };

    const history = [
        { year: '2021–Present', role: 'Chief Future Officer / CIO', company: 'Maryville University', note: 'Revolutionizing higher ed software' },
        { year: '2017–2021', role: 'VP of Innovation', company: 'Salesforce', note: 'Helped Fortune 500s see around corners' },
        { year: '2015–2017', role: 'Chief Digital Officer', company: 'UT System', note: 'Built McRaven\'s quantum leap: UTx' },
        { year: '2014–2015', role: 'CEO, USA', company: 'Robots and Pencils', note: '35th fastest growing tech company. 3,400% growth.' },
        { year: '2009–2014', role: 'VP & CIO', company: 'Seton Hill University', note: 'iPads for Everyone. 2010. Changed the game.' }
    ];

    // Commands
    const commands = {
        help: () => {
            return `
<span class="highlight">Available commands:</span>

  <span class="clickable-cmd" data-cmd="whoami">whoami</span>      - Who is Phil Komarny?
  <span class="clickable-cmd" data-cmd="bio">bio</span>         - The long version
  <span class="clickable-cmd" data-cmd="history">history</span>     - Career timeline
  <span class="clickable-cmd" data-cmd="thoughts">thoughts</span>    - What I'm thinking about
  <span class="clickable-cmd" data-cmd="contact">contact</span>     - Get in touch
  <span class="clickable-cmd" data-cmd="clear">clear</span>       - Clear terminal
  <span class="clickable-cmd" data-cmd="ls">ls</span>          - List directory
  <span class="clickable-cmd" data-cmd="pwd">pwd</span>         - Where am I?

<span class="dim">Pro tip: Click any command to run it</span>`;
        },

        whoami: () => {
            return `
<span class="highlight">${bio.name}</span>
${bio.title}
Previously: ${bio.previous}
Location: ${bio.location}
Status: ${bio.status}`;
        },

        bio: () => {
            return `
<span class="highlight">I make AI useful.</span>

Not theoretical. Not hype. Useful.

I've spent 30 years figuring out how to make technology
actually work for organizations. The hard part was never
the tech — it was the translation.

Helping people see what's possible, then making it real.

Now I'm in the Gunnison Valley, helping local businesses
cut through the AI noise. The same strategic thinking
that Fortune 500 companies pay for, available to the
people and places I care about.

<span class="dim">No jargon. No black boxes. Just honest answers.</span>

Type <span class="clickable-cmd" data-cmd="history">history</span> for career timeline.`;
        },

        history: () => {
            let output = '\n<span class="highlight">Career Timeline</span>\n\n';
            history.forEach(h => {
                output += `<span class="highlight">${h.year}</span>  ${h.role}\n`;
                output += `           ${h.company}\n`;
                output += `           <span class="dim">${h.note}</span>\n\n`;
            });
            output += `<span class="dim">There's more. A lot more. But you get the idea —
I've been doing this since before most AI models were born.</span>

<span class="link" data-url="https://www.linkedin.com/in/philkomarny/">→ LinkedIn for the full archaeology</span>`;
            return output;
        },

        thoughts: () => {
            return `
<span class="highlight">Dispatches</span>

<span class="dim">Writing in progress...</span>

<span class="amber">█</span> Observations on AI, technology, and getting things done.

Check back soon.`;
        },

        contact: () => {
            return `
<span class="highlight">Get in Touch</span>

Got a question? An idea? Want to know if AI
makes sense for your situation? Pick your poison:

<span class="link" data-url="sms:+17246896476">📱 mobile/sms</span>     724-689-6476
<span class="link" data-url="https://wa.me/+17246896476">💬 whatsapp</span>       wa.me/+17246896476
<span class="link" data-url="https://t.me/PhilKomarny">✈️  telegram</span>       t.me/PhilKomarny
<span class="highlight">🎮 discord</span>        PKCxO
<span class="link" data-url="mailto:phil@komarny.com">📧 email</span>          phil@komarny.com <span class="dim">(if you must)</span>`;
        },

        clear: () => {
            output.innerHTML = '';
            return null;
        },

        ls: () => {
            return `<span class="highlight">.</span>
├── <span class="clickable-cmd" data-cmd="whoami">whoami</span>
├── <span class="clickable-cmd" data-cmd="bio">bio.txt</span>
├── <span class="clickable-cmd" data-cmd="history">career_history/</span>
├── <span class="clickable-cmd" data-cmd="thoughts">thoughts/</span>
└── <span class="clickable-cmd" data-cmd="contact">contact.md</span>`;
        },

        pwd: () => {
            return '/Users/phil/crested-butte/ai-consulting';
        },

        sudo: () => {
            return `<span class="error">Nice try. I appreciate the confidence though.</span>`;
        },

        'rm -rf': () => {
            return `<span class="error">I've seen what happens when people do that. Hard pass.</span>`;
        },

        'man phil': () => {
            return commands.bio();
        },

        vim: () => {
            return `<span class="dim">Ah, a person of culture. But not today.</span>`;
        },

        emacs: () => {
            return `<span class="dim">Let's not start this debate.</span>`;
        },

        exit: () => {
            return `<span class="dim">Where would you go? Stay a while.</span>`;
        },

        hello: () => {
            return `<span class="highlight">Hey there!</span> Type <span class="clickable-cmd" data-cmd="help">help</span> to see what you can do.`;
        },

        hi: () => commands.hello(),

        coffee: () => {
            return `<span class="highlight">☕</span> Good idea. BRB.`;
        },

        '': () => null
    };

    // Initial boot sequence
    function boot() {
        const bootSequence = [
            { text: 'Last login: ' + new Date().toDateString() + ' on ttys000', delay: 0 },
            { text: '', delay: 100 },
            { cmd: 'whoami', delay: 500 }
        ];

        let totalDelay = 0;
        bootSequence.forEach(item => {
            totalDelay += item.delay;
            setTimeout(() => {
                if (item.cmd) {
                    executeCommand(item.cmd);
                } else {
                    appendOutput(item.text, 'dim');
                }
            }, totalDelay);
        });

        // Show help hint after boot
        setTimeout(() => {
            appendOutput('', 'dim');
            appendOutput('Type help for available commands.', 'dim');
        }, totalDelay + 500);
    }

    // Append output to terminal
    function appendOutput(text, className = '') {
        const line = document.createElement('div');
        line.className = 'line ' + className;
        line.innerHTML = text;
        output.appendChild(line);
        scrollToBottom();

        // Add click handlers for clickable commands
        line.querySelectorAll('.clickable-cmd').forEach(el => {
            el.addEventListener('click', () => {
                const cmd = el.getAttribute('data-cmd');
                if (cmd) executeCommand(cmd);
            });
        });

        // Add click handlers for links
        line.querySelectorAll('.link').forEach(el => {
            el.addEventListener('click', () => {
                const url = el.getAttribute('data-url');
                if (url) window.open(url, '_blank');
            });
        });
    }

    // Escape HTML to prevent XSS
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Execute a command
    function executeCommand(cmd) {
        const trimmedCmd = cmd.trim().toLowerCase();
        const safeCmd = escapeHTML(cmd);
        const safeTrimmedCmd = escapeHTML(trimmedCmd);

        // Show the command that was entered
        appendOutput(`<span class="prompt-display">phil@crestedbutte ~ %</span> <span class="command">${safeCmd}</span>`);

        // Find and execute command
        let result = null;
        if (commands[trimmedCmd]) {
            result = commands[trimmedCmd]();
        } else if (trimmedCmd.startsWith('rm ')) {
            result = commands['rm -rf']();
        } else if (trimmedCmd) {
            result = `<span class="error">zsh: command not found: ${safeTrimmedCmd}</span>\nType <span class="clickable-cmd" data-cmd="help">help</span> for available commands.`;
        }

        if (result !== null) {
            appendOutput(result);
        }
    }

    // Scroll to bottom
    function scrollToBottom() {
        terminal.scrollTop = terminal.scrollHeight;
    }

    // Handle input
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = input.value;
            input.value = '';
            executeCommand(cmd);
        }
    });

    // Focus input when clicking anywhere in terminal
    terminal.addEventListener('click', () => {
        input.focus();
    });

    // Start boot sequence
    boot();

})();
