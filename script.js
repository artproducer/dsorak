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

        // Animación de "peek" scroll en la lista de plataformas
        const scrollList = modal.querySelector('.platform-checkboxes');
        if (scrollList) {
            scrollList.scrollTop = 0; // Reset inicial

            setTimeout(() => {
                // Baja de manera mucho más notable y suave
                scrollList.scrollTo({
                    top: 400, // Scroll mucho más largo
                    behavior: 'smooth'
                });

                // Espera un momento largo abajo para que se aprecie el contenido
                setTimeout(() => {
                    scrollList.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }, 600); // Retorno más ágil
            }, 800); // Esperar un poco más para que la transición del modal sea fluida
        }
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
        const numberEl = container.querySelector('.payment-number');
        const btnCopy = container.querySelector('.btn-copy');

        // Update button state
        if (btnCopy) {
            btnCopy.classList.add('copied');
            const originalBtnHtml = btnCopy.innerHTML;
            btnCopy.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copiado';
            setTimeout(() => {
                btnCopy.innerHTML = originalBtnHtml;
                btnCopy.classList.remove('copied');
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
// ===== GLOBAL STATE =====
let appState = {
    config: null,
    prices: null
};

// ===== DATA LOADING =====
async function loadData() {
    try {
        const [configRes, pricesRes] = await Promise.all([
            fetch('config.json'),
            fetch('prices.json')
        ]);
        appState.config = await configRes.json();
        appState.prices = await pricesRes.json();
        return true;
    } catch (error) {
        console.error('Error loading data:', error);
        return false;
    }
}

// ===== HELPER: NORMALIZE PLATFORM NAME =====
function normalizePlatformName(name) {
    // Inverse mapping table since JSON keys don't always match simple lowercase rules
    // We try to match the HTML data-platform to the JSON key
    const mapping = {
        "Netflix": "netflix",
        "Disney+ Premium": "disney_premium",
        "Disney+ Estándar": "disney_standard",
        "HBO Max": "hbo_max",
        "Prime Video": "prime_video",
        "Paramount+": "paramount",
        "Crunchyroll MegaFan": "crunchyroll",
        "VIX Premium": "vix_premium",
        "Spotify Premium": "spotify",
        "YouTube Premium": "youtube_premium",
        "Canva Pro": "canva_pro",
        "Gemini AI Pro": "gemini_ai",
        "ChatGPT Go": "chatgpt_go",
        "ChatGPT Plus": "chatgpt_plus",
        "Apple TV+": "apple_tv", // Assuming key might exist or fallback
        "IPTV Premium": "iptv_premium", // Assuming key
        "Plex": "plex", // Assuming key
        "CapCut Pro": "capcut_pro" // Assuming key
    };

    return mapping[name] || name.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// ===== SYNC DISABLED PLATFORMS FROM CONFIG =====
async function syncDisabledPlatforms() {
    // Ensure data is loaded
    if (!appState.config) await loadData();
    if (!appState.config) return;

    let disabledPlatforms = new Set();
    const config = appState.config;
    // ... logic uses appState.config now

    // Get disabled platforms from config
    for (const [platform, settings] of Object.entries(config.platforms)) {
        if (!settings.enabled) {
            disabledPlatforms.add(platform);
        }
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

// ===== HELPER: UPDATE DOM PRICES FROM JSON =====
function updateDomPrices() {
    if (!appState.prices) return;

    // Update Platform Cards
    const cards = document.querySelectorAll('.platform-card[data-platform]');
    cards.forEach(card => {
        const platformName = card.getAttribute('data-platform');
        const key = normalizePlatformName(platformName);
        const platformData = appState.prices.platforms[key];

        if (platformData) {
            // Update base price attribute
            if (platformData.pricePerMonth) {
                card.setAttribute('data-price-1m', platformData.pricePerMonth);
            }

            // Update visible prices
            const priceAmount = card.querySelector('.price-amount');
            const pricePerUnit = card.querySelector('.price-per-unit');

            // Initial state: 1 month, 1 profile
            if (priceAmount && platformData.pricePerMonth) {
                priceAmount.textContent = `$${platformData.pricePerMonth.toLocaleString('es-CO')}`;
            }
            if (pricePerUnit && platformData.pricePerMonth) {
                const unit = platformData.pricing ? 'cuenta' : 'perfil'; // Heuristic
                pricePerUnit.textContent = `$${platformData.pricePerMonth.toLocaleString('es-CO')}/${unit}`;
            }
        }
    });

    // Update Combo Checkboxes
    const checkboxes = document.querySelectorAll('.platform-option input[type="checkbox"]');
    checkboxes.forEach(cb => {
        const platformName = cb.dataset.name;
        const key = normalizePlatformName(platformName);
        const platformData = appState.prices.platforms[key];

        if (platformData && platformData.pricePerMonth) {
            cb.dataset.price = platformData.pricePerMonth;

            // Update label text
            const label = cb.closest('label');
            if (label) {
                const textSpan = label.querySelector('.platform-name-text');
                if (textSpan) {
                    textSpan.textContent = `${platformName} ($${platformData.pricePerMonth.toLocaleString('es-CO')})`;
                }
            }
        }
    });
}

// ===== QUANTITY SELECTOR FOR PLATFORMS =====
async function initQuantitySelectors() {
    // Ensure data is loaded
    if (!appState.prices) await loadData();
    // First, sync disabled platforms from config
    await syncDisabledPlatforms();

    // Update prices in DOM from JSON
    if (appState.prices) {
        updateDomPrices();
    }

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
        const MAX_MONTHS = platform === 'ChatGPT Go' ? 6 : 3;

        // Change "Perfiles" label to "Cuentas" for account-based platforms
        const platformsWithAccount = ['YouTube Premium', 'Canva Pro', 'Gemini AI Pro', 'CapCut Pro', 'ChatGPT Go', 'ChatGPT Plus'];
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
            if (!appState.prices) return 0;

            const rules = appState.prices.discounts.profiles;
            // Check exact match first, then "3+" type logic
            if (rules[qty]) return rules[qty];

            // Check for "+" rules (e.g. "3+")
            for (const key of Object.keys(rules)) {
                if (key.endsWith('+')) {
                    const threshold = parseInt(key);
                    if (qty >= threshold) return rules[key];
                }
            }
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
            // Calculate final price
            let finalPrice;

            // Check if there is specific pricing logic for this platform in JSON
            const platformKey = normalizePlatformName(platform);
            const platformData = appState.prices ? appState.prices.platforms[platformKey] : null;

            if (platformData && platformData.pricing) {
                // Custom pricing logic found in JSON (like YouTube)
                // We map 1, 2, 3 months to the keys in json
                let pricePerOne = 0;
                if (months === 1) pricePerOne = platformData.pricing["1_month"];
                else if (months === 2) pricePerOne = platformData.pricing["2_months"];
                else if (months === 3) pricePerOne = platformData.pricing["3_months"];
                else if (months === 6 && platformData.pricing["6_months"]) pricePerOne = platformData.pricing["6_months"];
                else pricePerOne = platformData.pricing["1_month"]; // Fallback

                finalPrice = pricePerOne * profiles;
            } else {
                // Standard pricing for other platforms
                // Use price from JSON if available, otherwise use basePrice (HTML fallback)
                let currentBasePrice = basePrice;
                if (platformData && platformData.pricePerMonth) {
                    currentBasePrice = platformData.pricePerMonth;
                }

                const totalBase = currentBasePrice * profiles * months;
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
                const platformsWithAccount = ['YouTube Premium', 'Canva Pro', 'Gemini AI Pro', 'CapCut Pro', 'ChatGPT Go', 'ChatGPT Plus'];
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
                const platformsWithAccount = ['YouTube Premium', 'Canva Pro', 'Gemini AI Pro', 'CapCut Pro', 'ChatGPT Go', 'ChatGPT Plus'];
                const isAccountBased = platformsWithAccount.includes(platform);
                const unitLabel = isAccountBased ? (profiles === 1 ? 'Cuenta' : 'Cuentas') : (profiles === 1 ? 'Perfil' : 'Perfiles');
                selectionBadge.textContent = `${monthsText} • ${profiles} ${unitLabel}`;
            }

            // Update WhatsApp link
            const priceText = `$${finalPrice.toLocaleString('es-CO')}`;
            const monthsText = months > 1 ? `${months} Meses` : '1 Mes';
            const platformsWithAccountMsg = ['YouTube Premium', 'Canva Pro', 'Gemini AI Pro', 'CapCut Pro', 'ChatGPT Go', 'ChatGPT Plus'];
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
                    // Try to get price from JSON first
                    const name = cb.dataset.name;
                    const key = normalizePlatformName(name);
                    let price = parseInt(cb.dataset.price);

                    if (appState.prices && appState.prices.platforms[key]) {
                        price = appState.prices.platforms[key].pricePerMonth;
                    }

                    total += price;
                    selectedNames.push(name);
                }
            });

            // Calculate discount based on count
            const count = selectedNames.length;
            let discount = 0;

            if (appState.prices) {
                const rules = appState.prices.discounts.combo;
                if (rules[count]) discount = rules[count];
                else {
                    // Check for "+" rules
                    for (const key of Object.keys(rules)) {
                        if (key.endsWith('+')) {
                            const threshold = parseInt(key);
                            if (count >= threshold) discount = rules[key];
                        }
                    }
                }
            } else {
                // Fallback only if JSON fails
                if (count === 2) discount = 2000;
                else if (count === 3) discount = 4000;
                else if (count === 4) discount = 7000;
                else if (count >= 5) discount = 10000;
            }

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
