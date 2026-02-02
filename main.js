/**
 * Anti-Portfolio — Statement Rotation
 */

(function() {
    'use strict';

    const statements = document.querySelectorAll('.statement');
    const progressBar = document.querySelector('.progress-bar');

    if (statements.length === 0) return;

    let currentIndex = 0;
    let isPaused = false;
    const INTERVAL = 4000; // 4 seconds per statement

    function showStatement(index) {
        statements.forEach((statement, i) => {
            statement.classList.remove('active', 'exiting');
            if (i === index) {
                statement.classList.add('active');
            }
        });
    }

    function nextStatement() {
        if (isPaused) return;

        const currentStatement = statements[currentIndex];
        currentStatement.classList.add('exiting');
        currentStatement.classList.remove('active');

        currentIndex = (currentIndex + 1) % statements.length;

        setTimeout(() => {
            showStatement(currentIndex);
        }, 300);

        // Reset progress bar
        if (progressBar) {
            progressBar.style.animation = 'none';
            progressBar.offsetHeight; // Trigger reflow
            progressBar.style.animation = 'progress 4s linear infinite';
        }
    }

    // Auto-rotate
    let rotationInterval = setInterval(nextStatement, INTERVAL);

    // Click to pause/resume
    const container = document.querySelector('.statement-container');
    if (container) {
        container.addEventListener('click', () => {
            isPaused = !isPaused;

            if (isPaused) {
                if (progressBar) {
                    progressBar.style.animationPlayState = 'paused';
                }
            } else {
                if (progressBar) {
                    progressBar.style.animationPlayState = 'running';
                }
            }
        });

        // Cursor change on hover
        container.style.cursor = 'pointer';
    }

})();
