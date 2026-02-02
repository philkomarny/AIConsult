/**
 * Mountain — Sequence animations and parallax
 */

(function() {
    'use strict';

    // ==========================================
    // Sequence Rotation
    // ==========================================

    const sequences = document.querySelectorAll('.sequence');
    const dots = document.querySelectorAll('.dot');

    if (sequences.length > 0) {
        let currentIndex = 0;
        let isPaused = false;
        const INTERVAL = 5000; // 5 seconds per sequence

        function showSequence(index) {
            sequences.forEach((seq, i) => {
                seq.classList.remove('active', 'exiting');
                if (i === index) {
                    seq.classList.add('active');
                }
            });

            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }

        function nextSequence() {
            if (isPaused) return;

            const currentSeq = sequences[currentIndex];
            currentSeq.classList.add('exiting');
            currentSeq.classList.remove('active');

            currentIndex = (currentIndex + 1) % sequences.length;

            setTimeout(() => {
                showSequence(currentIndex);
            }, 400);
        }

        // Auto-rotate
        let rotationInterval = setInterval(nextSequence, INTERVAL);

        // Click dots to navigate
        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                if (i === currentIndex) return;

                clearInterval(rotationInterval);

                const currentSeq = sequences[currentIndex];
                currentSeq.classList.add('exiting');
                currentSeq.classList.remove('active');

                currentIndex = i;

                setTimeout(() => {
                    showSequence(currentIndex);
                }, 400);

                // Restart rotation
                rotationInterval = setInterval(nextSequence, INTERVAL);
            });
        });

        // Pause on hover
        const container = document.querySelector('.sequence-container');
        if (container) {
            container.addEventListener('mouseenter', () => {
                isPaused = true;
            });

            container.addEventListener('mouseleave', () => {
                isPaused = false;
            });
        }
    }

    // ==========================================
    // Parallax for mountain layers
    // ==========================================

    const rangeFar = document.querySelector('.range-far');
    const rangeMid = document.querySelector('.range-mid');
    const rangeNear = document.querySelector('.range-near');

    if (rangeFar && rangeMid && rangeNear) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            const rate = scrolled * 0.1;

            rangeFar.style.transform = `translateY(${10 + rate * 0.5}%)`;
            rangeMid.style.transform = `translateY(${5 + rate * 0.3}%)`;
            rangeNear.style.transform = `translateY(${rate * 0.1}%)`;
        }, { passive: true });
    }

    // ==========================================
    // Subtle mouse parallax for stars
    // ==========================================

    const stars = document.querySelector('.stars');

    if (stars) {
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 10;
            const y = (e.clientY / window.innerHeight - 0.5) * 10;
            stars.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

})();
