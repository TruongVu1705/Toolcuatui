/* ==========================================================================
   OmniTool Hub - GSAP Animations & Dynamic Visual Effects
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Load Animations
    if (window.gsap) {
        // Animate Sidebar Entrance
        gsap.from('.sidebar', {
            x: -80,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out'
        });

        // Animate Header Entrance
        gsap.from('.top-header', {
            y: -30,
            opacity: 0,
            duration: 0.7,
            delay: 0.2,
            ease: 'power3.out'
        });

        // Animate Active Tool Card
        gsap.from('.tool-pane.active .glass-panel', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            delay: 0.4,
            ease: 'back.out(1.2)'
        });
    }
});

/**
 * Animate Tab Transition with GSAP
 * @param {HTMLElement} currentPane 
 * @param {HTMLElement} targetPane 
 */
function animateTabSwitch(currentPane, targetPane) {
    if (!window.gsap) {
        if (currentPane) currentPane.classList.remove('active');
        if (targetPane) targetPane.classList.add('active');
        return;
    }

    if (currentPane) {
        gsap.to(currentPane, {
            opacity: 0,
            y: -15,
            duration: 0.25,
            ease: 'power2.in',
            onComplete: () => {
                currentPane.classList.remove('active');
                targetPane.classList.add('active');
                
                gsap.fromTo(targetPane, 
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }
                );
            }
        });
    } else {
        targetPane.classList.add('active');
        gsap.fromTo(targetPane, 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }
        );
    }
}

/**
 * Trigger Confetti Effect on Successful File Generation
 */
function triggerSuccessConfetti() {
    if (window.confetti) {
        confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00f2fe', '#4facfe', '#7f00ff', '#22c55e', '#ffb703']
        });
    }
}
