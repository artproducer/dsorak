// ===== MOBILE MENU TOGGLE =====
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('active');
}

// ===== FAQ ACCORDION =====
function toggleFaq(element) {
    const faqItem = element.parentElement;
    const wasActive = faqItem.classList.contains('active');

    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });

    // Open clicked item if it wasn't active
    if (!wasActive) {
        faqItem.classList.add('active');
    }
}

// ===== HEADER SCROLL EFFECT =====
window.addEventListener('scroll', function () {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ===== SMOOTH SCROLL FOR NAVIGATION =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                const mobileMenu = document.getElementById('mobileMenu');
                if (mobileMenu.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                }
            }
        }
    });
});

// ===== ANIMATION ON SCROLL =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.platform-card, .combo-card, .referencia-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });

    // ===== CAROUSEL LOGIC =====
    const track = document.querySelector('.carousel-track');
    if (track) {
        const slides = Array.from(track.children);
        const nextButton = document.querySelector('.carousel-button--right');
        const prevButton = document.querySelector('.carousel-button--left');
        const dotsNav = document.querySelector('.carousel-nav');
        const dots = Array.from(dotsNav.children);

        // Check if slides exist
        if (slides.length === 0) return;

        const getSlideWidth = () => slides[0].getBoundingClientRect().width;

        const setSlidePosition = (slide, index) => {
            slide.style.left = getSlideWidth() * index + 'px';
        };

        // Initial positioning
        slides.forEach(setSlidePosition);

        const moveToSlide = (track, currentSlide, targetSlide) => {
            track.style.transform = 'translateX(-' + targetSlide.style.left + ')';
            currentSlide.classList.remove('current-slide');
            targetSlide.classList.add('current-slide');
        };

        const updateDots = (currentDot, targetDot) => {
            currentDot.classList.remove('current-slide');
            targetDot.classList.add('current-slide');
        };

        const getVisibleSlides = () => window.innerWidth > 768 ? 3 : 1;

        const hideShowArrows = (slides, prevButton, nextButton, targetIndex) => {
            const visibleSlides = getVisibleSlides();
            if (targetIndex === 0) {
                prevButton.classList.add('is-hidden');
                nextButton.classList.remove('is-hidden');
            } else if (targetIndex >= slides.length - visibleSlides) {
                prevButton.classList.remove('is-hidden');
                nextButton.classList.add('is-hidden');
            } else {
                prevButton.classList.remove('is-hidden');
                nextButton.classList.remove('is-hidden');
            }
        };

        // Initial arrow state
        hideShowArrows(slides, prevButton, nextButton, 0);

        // Click Left
        prevButton.addEventListener('click', e => {
            const currentSlide = track.querySelector('.current-slide');
            const prevSlide = currentSlide.previousElementSibling;
            const currentDot = dotsNav.querySelector('.current-slide');
            const prevDot = currentDot.previousElementSibling;
            const prevIndex = slides.findIndex(slide => slide === prevSlide);

            if (prevSlide) {
                moveToSlide(track, currentSlide, prevSlide);
                updateDots(currentDot, prevDot);
                hideShowArrows(slides, prevButton, nextButton, prevIndex);
            }
        });

        // Click Right
        nextButton.addEventListener('click', e => {
            const currentSlide = track.querySelector('.current-slide');
            const nextSlide = currentSlide.nextElementSibling;
            const currentDot = dotsNav.querySelector('.current-slide');
            const nextDot = currentDot.nextElementSibling;
            const nextIndex = slides.findIndex(slide => slide === nextSlide);

            // Check if we can move (don't move past the end)
            if (nextSlide && nextIndex <= slides.length - getVisibleSlides()) {
                moveToSlide(track, currentSlide, nextSlide);
                updateDots(currentDot, nextDot);
                hideShowArrows(slides, prevButton, nextButton, nextIndex);
            } else if (nextSlide && getVisibleSlides() === 1) {
                // Mobile behavior (always move if next slide exists)
                moveToSlide(track, currentSlide, nextSlide);
                updateDots(currentDot, nextDot);
                hideShowArrows(slides, prevButton, nextButton, nextIndex);
            }
        });

        // Click Nav Indicators
        dotsNav.addEventListener('click', e => {
            const targetDot = e.target.closest('button');
            if (!targetDot) return;

            const currentSlide = track.querySelector('.current-slide');
            const currentDot = dotsNav.querySelector('.current-slide');
            const targetIndex = dots.findIndex(dot => dot === targetDot);
            const targetSlide = slides[targetIndex];

            // Adjust target index if it goes out of bounds for desktop
            if (targetIndex > slides.length - getVisibleSlides()) {
                // Optional: prevent clicking dots that show empty space? 
                // For now, let it slide but arrows might behave weirdly if we don't clamp.
                // Let's just move.
            }

            moveToSlide(track, currentSlide, targetSlide);
            updateDots(currentDot, targetDot);
            hideShowArrows(slides, prevButton, nextButton, targetIndex);
        });

        // Handle Window Resize
        window.addEventListener('resize', () => {
            slides.forEach(setSlidePosition);
            const currentSlide = track.querySelector('.current-slide');
            if (currentSlide) {
                track.style.transform = 'translateX(-' + currentSlide.style.left + ')';
            }
            // Update arrows on resize
            const currentIndex = slides.findIndex(slide => slide === currentSlide);
            hideShowArrows(slides, prevButton, nextButton, currentIndex);
        });
    }

    // ===== CUSTOM COMBO LOGIC =====
    const checkboxes = document.querySelectorAll('.platform-option input[type="checkbox"]');
    const priceDisplay = document.getElementById('ultimate-price');
    const btnUltimate = document.getElementById('btn-ultimate');

    if (checkboxes.length && priceDisplay && btnUltimate) {
        console.log('Custom Combo elements found');

        function updateCombo() {
            let total = 0;
            let selectedNames = [];

            checkboxes.forEach(cb => {
                if (cb.checked) {
                    total += parseInt(cb.dataset.price);
                    selectedNames.push(cb.dataset.name);
                }
            });

            // Calculate discount based on count
            const count = selectedNames.length;
            let discount = 0;

            if (count === 2) discount = 3000;
            else if (count === 3) discount = 5000;
            else if (count === 4) discount = 7000;
            else if (count >= 5) discount = 12000;

            let finalPrice = total > 0 ? total - discount : 0;
            if (finalPrice < 0) finalPrice = 0;

            // Format price
            priceDisplay.textContent = '$' + finalPrice.toLocaleString('es-CO');

            // Update savings text
            const savingsDisplay = document.querySelector('.combo-ultimate .combo-savings');
            if (savingsDisplay) {
                savingsDisplay.textContent = discount > 0 ? `💰 Ahorro de $${discount.toLocaleString('es-CO')} aplicado` : 'Selecciona 2 o más para descuento';
            }

            // Update WhatsApp Link
            // Ensure no extra spaces in the URL construction
            const message = `Hola! Quiero armar mi Combo Personalizado con: ${selectedNames.join(', ')}. Precio Total: $${finalPrice.toLocaleString('es-CO')}`;

            // Use encodeURIComponent to handle all special characters and spaces
            const encodedMessage = encodeURIComponent(message);

            // Construct the final URL
            btnUltimate.href = `https://wa.me/573058588651?text=${encodedMessage}`;
            console.log('Combo updated:', finalPrice, btnUltimate.href);

            // Sync Suggestion Buttons
            const COMBO_DEFINITIONS = {
                'starter': ['Netflix', 'Prime Video'],
                'premium': ['Netflix', 'Disney+ Premium', 'HBO Max', 'Prime Video']
            };

            const suggestionBtns = document.querySelectorAll('.btn-suggestion');

            suggestionBtns.forEach(btn => {
                const comboKey = btn.dataset.combo;
                const targetApps = COMBO_DEFINITIONS[comboKey];

                if (targetApps) {
                    // Check if perfect match (exact arrays, order doesn't matter)
                    const isMatch = targetApps.length === selectedNames.length &&
                        targetApps.every(name => selectedNames.includes(name));

                    if (isMatch) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                }
            });
        }

        // Suggestions Logic
        // Suggestions Click Logic
        const suggestionBtns = document.querySelectorAll('.btn-suggestion');
        const COMBO_DEFINITIONS = {
            'starter': ['Netflix', 'Prime Video'],
            'premium': ['Netflix', 'Disney+ Premium', 'HBO Max', 'Prime Video']
        };

        suggestionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const combo = btn.dataset.combo;
                const targets = COMBO_DEFINITIONS[combo];

                if (targets) {
                    // Reset all first
                    checkboxes.forEach(cb => cb.checked = false);

                    // Select targets
                    checkboxes.forEach(cb => {
                        if (targets.includes(cb.dataset.name)) cb.checked = true;
                    });

                    // Update UI (Calculation + Visual Sync)
                    updateCombo();

                    // Visual feedback animation
                    btn.style.transform = 'scale(0.95)';
                    setTimeout(() => btn.style.transform = '', 150);
                }
            });
        });

        checkboxes.forEach(cb => {
            cb.addEventListener('change', updateCombo);
        });

        // Initial calculation
        updateCombo();
    } else {
        console.error('Custom Combo elements missing:', {
            checkboxes: checkboxes.length,
            priceDisplay: !!priceDisplay,
            btnUltimate: !!btnUltimate
        });
    }

    // Check for hash on load to open FAQ
    if (window.location.hash === '#faq-reseller') {
        const faqItem = document.getElementById('faq-reseller');
        if (faqItem) {
            const question = faqItem.querySelector('.faq-question');
            if (question) {
                // Small delay to ensure scroll happens first
                setTimeout(() => {
                    toggleFaq(question);
                    // Scroll into view again just in case
                    faqItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 500);
            }
        }
    }

    // Visitor Counter Logic (Simulated)
    const counterElement = document.getElementById('visit-count');
    if (counterElement) {
        let count = localStorage.getItem('page_visits');

        if (!count) {
            // Start at a realistic number if no data exists
            count = 100;
        } else {
            count = parseInt(count);
        }

        // Increment
        count++;

        // Save
        localStorage.setItem('page_visits', count);

        // Display with formatting
        counterElement.textContent = count.toLocaleString('es-CO');
    }
    // Scroll Buttons Logic (Section by Section)
    const scrollUpBtn = document.getElementById('scroll-up');
    const scrollDownBtn = document.getElementById('scroll-down');

    // Define sections in order
    const getSections = () => {
        // Get all main sections plus header and footer
        const sections = Array.from(document.querySelectorAll('header, section, footer'));
        return sections.filter(section => section.offsetHeight > 0); // Only visible sections
    };

    const getCurrentSectionIndex = (sections) => {
        const scrollPosition = window.scrollY + (window.innerHeight / 3); // Offset to determine "current"

        for (let i = sections.length - 1; i >= 0; i--) {
            if (sections[i].offsetTop <= scrollPosition) {
                return i;
            }
        }
        return 0;
    };

    if (scrollUpBtn && scrollDownBtn) {
        scrollUpBtn.addEventListener('click', () => {
            const sections = getSections();
            const currentIndex = getCurrentSectionIndex(sections);
            const prevIndex = Math.max(0, currentIndex - 1);

            sections[prevIndex].scrollIntoView({ behavior: 'smooth' });
        });

        scrollDownBtn.addEventListener('click', () => {
            const sections = getSections();
            const currentIndex = getCurrentSectionIndex(sections);
            const nextIndex = Math.min(sections.length - 1, currentIndex + 1);

            sections[nextIndex].scrollIntoView({ behavior: 'smooth' });
        });
    }
});
