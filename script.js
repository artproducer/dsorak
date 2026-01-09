// ===== MOBILE MENU TOGGLE =====
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('active');
}

// ===== COMBO MODAL =====
function openComboModal() {
    const modal = document.getElementById('combo-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
}

function closeComboModal() {
    const modal = document.getElementById('combo-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Close modal when clicking outside content
document.addEventListener('click', function (e) {
    const modal = document.getElementById('combo-modal');
    if (e.target === modal) {
        closeComboModal();
    }
});

// Close modal with ESC key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeComboModal();
    }
});

// ===== COPY PAYMENT NUMBER =====
function copyPaymentNumber(element) {
    if (!element) return;

    const container = element.classList.contains('payment-info-card') ? element : element.closest('.payment-info-card');
    const numberElement = container ? container.querySelector('.payment-number') : document.getElementById('paymentNumber');

    if (!numberElement) return;

    const paymentNumber = numberElement.innerText;

    // Copy to clipboard using modern API
    navigator.clipboard.writeText(paymentNumber).then(() => {
        // Visual feedback on success
        container.classList.add('copied');
        const feedbackEl = container.querySelector('.payment-number') || container;
        const originalText = feedbackEl.innerText;

        // Show temporary feedback text
        if (container.querySelector('.payment-number')) {
            feedbackEl.innerText = '¡Número Copiado!';
            setTimeout(() => {
                feedbackEl.innerText = paymentNumber;
                container.classList.remove('copied');
            }, 2000);
        }
    }).catch(err => {
        console.error('Error al copiar:', err);
    });
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

// ===== SYNC DISABLED PLATFORMS FROM CONFIG =====
async function syncDisabledPlatforms() {
    let disabledPlatforms = new Set();

    // Load config from JSON
    try {
        const response = await fetch('config.json');
        const config = await response.json();

        // Get disabled platforms from config
        for (const [platform, settings] of Object.entries(config.platforms)) {
            if (!settings.enabled) {
                disabledPlatforms.add(platform);
            }
        }
    } catch (error) {
        console.error('Error loading config.json:', error);
        return;
    }

    // Apply disabled state to platform cards
    const platformCards = document.querySelectorAll('.platform-card[data-platform]');
    platformCards.forEach(card => {
        const platformName = card.getAttribute('data-platform');

        if (disabledPlatforms.has(platformName)) {
            // Add disabled class
            card.classList.add('platform-disabled');

            // Hide selectors
            const selectorsRow = card.querySelector('.selectors-row-full');
            if (selectorsRow) {
                selectorsRow.style.display = 'none';
            }

            // Replace buy button with disabled button
            const buyBtn = card.querySelector('.btn-buy');
            if (buyBtn) {
                const disabledBtn = document.createElement('span');
                disabledBtn.className = 'btn btn-disabled btn-compact';
                disabledBtn.textContent = 'No disponible';
                buyBtn.replaceWith(disabledBtn);
            }
        } else {
            // Remove disabled class if present
            card.classList.remove('platform-disabled');
        }
    });

    // Sync with combo checkboxes
    const comboContainer = document.querySelector('.platform-checkboxes');
    const comboOptions = document.querySelectorAll('.platform-option');
    const disabledOptions = [];

    comboOptions.forEach(option => {
        const checkbox = option.querySelector('input[type="checkbox"]');
        if (checkbox) {
            const name = checkbox.dataset.name;

            if (disabledPlatforms.has(name)) {
                // Disable the combo option
                option.classList.add('platform-option-disabled');
                checkbox.disabled = true;
                checkbox.checked = false;

                // Store to move to end later
                disabledOptions.push(option);
            } else {
                // Enable the combo option
                option.classList.remove('platform-option-disabled');
                checkbox.disabled = false;
            }
        }
    });

    // Move disabled options to the end of the container
    if (comboContainer) {
        disabledOptions.forEach(option => {
            comboContainer.appendChild(option);
        });
    }
}

// ===== QUANTITY SELECTOR FOR PLATFORMS =====
async function initQuantitySelectors() {
    // First, sync disabled platforms from config
    await syncDisabledPlatforms();

    const platformCards = document.querySelectorAll('.platform-card[data-platform]');

    platformCards.forEach(card => {
        // Skip disabled platforms
        if (card.classList.contains('platform-disabled')) return;

        // Month selectors (first)
        const monthMinus = card.querySelector('.month-minus');
        const monthPlus = card.querySelector('.month-plus');
        const monthValue = card.querySelector('.month-value');

        // Profile selectors (find qty-value that is NOT month-value)
        const profileMinus = card.querySelector('.qty-minus');
        const profilePlus = card.querySelector('.qty-plus');
        const profileValue = card.querySelector('.qty-value:not(.month-value)');

        // Display elements
        const priceAmount = card.querySelector('.price-amount');
        const pricePerUnit = card.querySelector('.price-per-unit');
        const selectionBadge = card.querySelector('.selection-badge');
        const buyBtn = card.querySelector('.btn-buy');

        if (!profileMinus || !profilePlus || !profileValue || !buyBtn) return;

        const platform = card.getAttribute('data-platform');
        const basePrice = parseInt(card.getAttribute('data-price-1m'));
        const MAX_QTY = 3;
        const MAX_MONTHS = 3;

        // Change "Perfiles" label to "Cuentas" for account-based platforms
        const platformsWithAccount = ['YouTube Premium', 'Canva Pro', 'Gemini AI Pro', 'CapCut Pro'];
        if (platformsWithAccount.includes(platform)) {
            const qtyLabels = card.querySelectorAll('.qty-label');
            qtyLabels.forEach(label => {
                if (label.textContent === 'Perfiles') {
                    label.textContent = 'Cuentas';
                }
            });
        }

        let profiles = 1;
        let months = 1;

        function calculateDiscount(qty) {
            if (qty === 2) return 2000;
            if (qty >= 3) return 6000;
            return 0;
        }

        function update() {
            profileValue.textContent = profiles;
            if (monthValue) monthValue.textContent = months;

            // Calculate discounts
            const profileDiscount = calculateDiscount(profiles);
            const monthDiscount = calculateDiscount(months);
            // Calculate total discount (scale profile discount by months, and month discount by profiles)
            const totalDiscount = (profileDiscount * months) + (monthDiscount * profiles);


            // Calculate final price
            let finalPrice;
            if (platform === 'YouTube Premium') {
                // Custom pricing for YouTube
                let pricePerOne = 7000;
                if (months === 2) pricePerOne = 12000;
                if (months === 3) pricePerOne = 16000;

                finalPrice = pricePerOne * profiles;
            } else {
                // Standard pricing for other platforms
                const totalBase = basePrice * profiles * months;
                const finalPriceStd = totalBase - totalDiscount;
                finalPrice = finalPriceStd;
            }

            // Calculate price per screen (per profile per month-unit)
            // For display purposes, we just want the total / profiles usually, or just total.
            // But preserving logic:
            const pricePerScreen = Math.round(finalPrice / profiles / months);

            // Update price display
            if (priceAmount) {
                priceAmount.textContent = `$${finalPrice.toLocaleString('es-CO')}`;
            }

            // Update price per unit with dynamic label
            if (pricePerUnit) {
                const platformsWithAccount = ['YouTube Premium', 'Canva Pro', 'Gemini AI Pro'];
                const isAccountBased = platformsWithAccount.includes(platform);
                const unitName = isAccountBased ? 'cuenta' : 'perfil';

                let priceValue, unitLabel;

                if (months > 1 && profiles > 1) {
                    // Both increased: show price per month per profile
                    priceValue = Math.round(finalPrice / profiles / months);
                    unitLabel = `mes x ${unitName}`;
                } else if (months > 1) {
                    // Only months increased: show price per month
                    priceValue = Math.round(finalPrice / months);
                    unitLabel = 'mes';
                } else if (profiles > 1) {
                    // Only profiles increased: show price per profile
                    priceValue = Math.round(finalPrice / profiles);
                    unitLabel = unitName;
                } else {
                    // Default: 1 month, 1 profile
                    priceValue = finalPrice;
                    unitLabel = unitName;
                }

                pricePerUnit.textContent = `$${priceValue.toLocaleString('es-CO')}/${unitLabel}`;
            }

            // Update selection badge with months and profiles
            if (selectionBadge) {
                const monthsText = months === 1 ? '1 Mes' : `${months} Meses`;
                const platformsWithAccount = ['YouTube Premium', 'Canva Pro', 'Gemini AI Pro', 'CapCut Pro'];
                const isAccountBased = platformsWithAccount.includes(platform);
                const unitLabel = isAccountBased ? (profiles === 1 ? 'Cuenta' : 'Cuentas') : (profiles === 1 ? 'Perfil' : 'Perfiles');
                selectionBadge.textContent = `${monthsText} • ${profiles} ${unitLabel}`;
            }

            // Update WhatsApp link
            const priceText = `$${finalPrice.toLocaleString('es-CO')}`;
            const monthsText = months > 1 ? `${months} Meses` : '1 Mes';
            const platformsWithAccountMsg = ['YouTube Premium', 'Canva Pro', 'Gemini AI Pro', 'CapCut Pro'];
            const unitText = platformsWithAccountMsg.includes(platform) ? 'cuentas' : 'perfiles';
            const message = `Quiero comprar ${platform} ${monthsText}${profiles > 1 ? ` (${profiles} ${unitText})` : ''} - Precio: ${priceText}`;
            buyBtn.href = `https://wa.me/573005965404?text=${encodeURIComponent(message)}`;

            // Update button states
            profileMinus.disabled = profiles <= 1;
            profilePlus.disabled = profiles >= MAX_QTY;
            if (monthMinus) monthMinus.disabled = months <= 1;
            if (monthPlus) monthPlus.disabled = months >= MAX_MONTHS;
        }

        // Profile event listeners
        profileMinus.addEventListener('click', (e) => {
            e.preventDefault();
            if (profiles > 1) { profiles--; update(); }
        });

        profilePlus.addEventListener('click', (e) => {
            e.preventDefault();
            if (profiles < MAX_QTY) { profiles++; update(); }
        });

        // Month event listeners
        if (monthMinus && monthPlus) {
            monthMinus.addEventListener('click', (e) => {
                e.preventDefault();
                if (months > 1) { months--; update(); }
            });

            monthPlus.addEventListener('click', (e) => {
                e.preventDefault();
                if (months < MAX_MONTHS) { months++; update(); }
            });
        }

        // Initialize
        update();
    });
}



// ===== HEADER SCROLL EFFECT =====
let lastScrollTop = 0;
let scrollTimeout;
window.addEventListener('scroll', function () {
    const header = document.querySelector('header');
    const scrollButtons = document.querySelector('.scroll-buttons');
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Header scrolled effect
    if (scrollTop > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    // Scroll Buttons collapsible logic
    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolling DOWN
        if (scrollButtons) scrollButtons.classList.add('hidden');
    } else {
        // Scrolling UP
        if (scrollButtons) scrollButtons.classList.remove('hidden');
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;

    // Show buttons again when scrolling stops
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function () {
        if (scrollButtons) scrollButtons.classList.remove('hidden');
    }, 1000);
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
    document.querySelectorAll('.platform-card, .referencia-card').forEach(card => {
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

            if (count === 2) discount = 2000;
            else if (count === 3) discount = 5000;
            else if (count === 4) discount = 7000;
            else if (count >= 5) discount = 10000;

            let finalPrice = total > 0 ? total - discount : 0;
            if (finalPrice < 0) finalPrice = 0;

            // Format price
            priceDisplay.textContent = '$' + finalPrice.toLocaleString('es-CO');

            // Update savings text
            const savingsDisplay = document.querySelector('.combo-ultimate .combo-savings');
            if (savingsDisplay) {
                if (count >= 2) {
                    savingsDisplay.textContent = `💰 Ahorro de $${discount.toLocaleString('es-CO')} aplicado`;
                    savingsDisplay.classList.remove('error-shake');
                } else {
                    savingsDisplay.textContent = 'Selecciona 2 o más para descuento';
                    savingsDisplay.classList.remove('error-shake');
                }
            }

            // Update WhatsApp Link
            const message = `Quiero mi Combo de: ${selectedNames.join(', ')}. Precio: $${finalPrice.toLocaleString('es-CO')}`;
            const encodedMessage = encodeURIComponent(message);
            btnUltimate.href = `https://wa.me/573005965404?text=${encodedMessage}`;

            // Store count for validation
            btnUltimate.dataset.selectedCount = count;
        }

        btnUltimate.addEventListener('click', function (e) {
            const count = parseInt(this.dataset.selectedCount || 0);
            if (count < 2) {
                e.preventDefault();
                const savingsDisplay = document.querySelector('.combo-ultimate .combo-savings');
                if (savingsDisplay) {
                    savingsDisplay.textContent = '❌ Selecciona 2 o más para continuar';
                    savingsDisplay.classList.add('error-shake');

                    // Remove class after animation to allow re-trigger
                    setTimeout(() => {
                        savingsDisplay.classList.remove('error-shake');
                    }, 400);
                }
            }
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

        // Hide buttons while scrolling
        let isScrolling;
        const scrollButtonsContainer = document.querySelector('.scroll-buttons');
        const whatsappFloat = document.querySelector('.whatsapp-float');

        window.addEventListener('scroll', () => {
            // Add class to hide buttons
            if (scrollButtonsContainer) {
                scrollButtonsContainer.classList.add('hidden');
            }
            if (whatsappFloat) {
                whatsappFloat.classList.add('hidden');
            }

            // Clear previous timeout
            window.clearTimeout(isScrolling);

            // Set a timeout to run after scrolling ends
            isScrolling = setTimeout(() => {
                if (scrollButtonsContainer) {
                    scrollButtonsContainer.classList.remove('hidden');
                }
                if (whatsappFloat) {
                    whatsappFloat.classList.remove('hidden');
                }
            }, 1000); // 1.0 second delay
        });
    }
});

// ===== LIGHTBOX LOGIC =====
function openLightbox(imgElement) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if (lightbox && lightboxImg) {
        lightboxImg.src = imgElement.src;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scroll
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto'; // Restore scroll
    }
}

// Add click events to carousel images and initialize quantity selectors
document.addEventListener('DOMContentLoaded', function () {
    const carouselImages = document.querySelectorAll('.carousel-slide img');
    carouselImages.forEach(img => {
        img.addEventListener('click', () => openLightbox(img));
    });

    // Initialize quantity selectors for platform cards
    initQuantitySelectors();
});
