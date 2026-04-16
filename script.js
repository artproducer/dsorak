// ===== SUPABASE INITIALIZATION =====
let _supabase;
function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase library not loaded! Check your script tags in index.html');
        return false;
    }
    
    const SUPABASE_URL = window.ENV?.SUPABASE_URL;
    const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        console.error('Supabase credentials missing! Check credentials.js');
        return false;
    }

    try {
        _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized successfully');
        return true;
    } catch (e) {
        console.error('Failed to create Supabase client:', e);
        return false;
    }
}

// ===== MOBILE MENU TOGGLE =====
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
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
    if (!_supabase) {
        if (!initSupabase()) {
            document.getElementById('main-platforms-grid').innerHTML = '<div style="color: #ef4444; padding: 20px; text-align: center;">Error: Credenciales de base de datos no encontradas. Asegúrate de que credentials.js esté presente.</div>';
            return false;
        }
    }

    try {
        console.log('Fetching data from Supabase...');
        // Fetch everything from Supabase
        const [platformsRes, settingsRes] = await Promise.all([
            _supabase.from('platforms').select('*').order('display_order', { ascending: true }),
            _supabase.from('app_settings').select('*')
        ]);

        if (platformsRes.error) throw platformsRes.error;
        if (settingsRes.error) throw settingsRes.error;

        // Transform platforms to match previous prices.json structure
        appState.prices = {
            platforms: {},
            discounts: {},
            metadata: {}
        };

        // Populate platforms
        platformsRes.data.forEach(p => {
            appState.prices.platforms[p.id] = {
                name: p.name,
                pricePerMonth: p.price_per_month,
                pricing: p.pricing,
                useCustomPricing: p.use_custom_pricing
            };
        });

        // Initialize config from platforms
        appState.config = { platforms: {} };
        platformsRes.data.forEach(p => {
            appState.config.platforms[p.id] = { enabled: p.enabled };
        });

        // Populate settings
        settingsRes.data.forEach(s => {
            if (s.key === 'discounts') appState.prices.discounts = s.value;
            if (s.key === 'metadata') appState.prices.metadata = s.value;
            if (s.key === 'whatsapp') appState.whatsapp = s.value;
        });

        // Use default if not set
        if (!appState.whatsapp) appState.whatsapp = { number: '573005965404' };

        // Save raw data for dynamic rendering
        appState.rawPlatforms = platformsRes.data;

        // Render everything
        renderMainPlatforms(platformsRes.data);
        renderComboOptions(platformsRes.data);

        return true;
    } catch (error) {
        console.error('Error loading data from Supabase:', error);
        return false;
    }
}

function renderMainPlatforms(platforms) {
    const grid = document.getElementById('main-platforms-grid');
    if (!grid) return;
    grid.innerHTML = '';

    platforms.filter(p => p.enabled).forEach(p => {
        try {
            const div = document.createElement('div');
            div.className = 'platform-card platform-card-v2';
            div.dataset.platform = p.name;
            div.dataset.price1m = parseInt(p.price_per_month) || 0;
            div.dataset.maxQty = parseInt(p.max_profiles) || 1;
            div.dataset.maxMonths = parseInt(p.max_months) || 1;
            
            const safePrice = parseInt(p.price_per_month) || 0;
            div.innerHTML = `
                <div class="price-corner">
                    <span class="price-amount">$${safePrice.toLocaleString('es-CO')}</span>
                    <span class="price-per-unit">$${safePrice.toLocaleString('es-CO')}/${p.name.includes('Account') ? 'cuenta' : 'perfil'}</span>
                </div>
                <div class="card-top-row">
                    <div class="platform-icon">
                        <img src="${p.image_url}" alt="${p.name}">
                    </div>
                    <div class="platform-info">
                        <div class="platform-header-row">
                            <h3 class="platform-name">${p.name}</h3>
                        </div>
                        <p class="platform-desc">${p.description || ''}</p>
                    </div>
                </div>
                <div class="card-bottom">
                    <div class="selectors-row-full">
                        <div class="quantity-selector">
                            <span class="qty-label">${p.name.includes('Account') ? 'Cuentas' : 'Perfiles'}</span>
                            <button class="qty-btn qty-minus">-</button>
                            <span class="qty-value">1</span>
                            <button class="qty-btn qty-plus">+</button>
                        </div>
                        <div class="quantity-selector">
                            <span class="qty-label">Meses</span>
                            <button class="qty-btn month-minus">-</button>
                            <span class="qty-value month-value">1</span>
                            <button class="qty-btn month-plus">+</button>
                        </div>
                        <div class="platform-footer-row">
                            <a href="#" class="btn btn-danger btn-buy btn-compact" target="_blank">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                Comprar
                            </a>
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(div);
            initCardLogic(div);
        } catch (e) {
            console.error('Error rendering individual platform:', e, p);
        }
    });
}

function renderComboOptions(platforms) {
    const containers = document.querySelectorAll('.platform-checkboxes');
    if (containers.length === 0) return;
    
    containers.forEach(container => {
        container.innerHTML = '';
        platforms.filter(p => p.enabled).forEach(p => {
            const label = document.createElement('label');
            label.className = 'platform-option';
            label.innerHTML = `
                <input type="checkbox" data-price="${p.price_per_month}" data-name="${p.name}">
                <span class="checkmark">
                    <img src="${p.image_url}" alt="${p.name}" class="platform-mini-logo">
                    <span class="platform-name-text">${p.name} ($${(p.price_per_month || 0).toLocaleString('es-CO')})</span>
                </span>
            `;
            container.appendChild(label);
        });
    });

    // Re-initialize combo logic after populating elements
    initComboLogic();
}

// (Duplicates removed)

// ===== CUSTOM COMBO LOGIC =====
function initComboLogic() {
    const checkboxes = document.querySelectorAll('.platform-option input[type="checkbox"]');
    const priceDisplay = document.getElementById('ultimate-price');
    const btnUltimate = document.getElementById('btn-ultimate');

    if (!checkboxes.length || !priceDisplay || !btnUltimate) return;

    function updateCombo() {
        let total = 0;
        let selectedNames = [];

        checkboxes.forEach(cb => {
            if (cb.checked) {
                const name = cb.dataset.name;
                const key = normalizePlatformName(name);
                let price = parseInt(cb.dataset.price);

                if (appState.prices && appState.prices.platforms[key]) {
                    const platformData = appState.prices.platforms[key];
                    if (platformData.pricePerMonth) {
                        price = platformData.pricePerMonth;
                    } else if (platformData.pricing && platformData.pricing["1_month"]) {
                        price = platformData.pricing["1_month"];
                    }
                }

                total += price;
                selectedNames.push(name);
            }
        });

        const count = selectedNames.length;
        let discount = 0;
        if (appState.prices && appState.prices.discounts && appState.prices.discounts.combo) {
            function getComboDiscount(count) {
                const rules = appState.prices.discounts.combo;
                if (rules[count]) return rules[count];
                
                // Handle X+ keys
                let maxThreshold = -1;
                let maxThresholdValue = 0;
                for (const key of Object.keys(rules)) {
                    if (key.endsWith('+')) {
                        const threshold = parseInt(key);
                        if (count >= threshold && threshold > maxThreshold) {
                            maxThreshold = threshold;
                            maxThresholdValue = rules[key];
                        }
                    }
                }
                return maxThresholdValue;
            }
            discount = getComboDiscount(count);
        }

        let finalPrice = total > 0 ? total - discount : 0;
        if (finalPrice < 0) finalPrice = 0;

        priceDisplay.textContent = '$' + finalPrice.toLocaleString('es-CO');

        const savingsDisplay = document.querySelector('.combo-ultimate .combo-savings');
        if (savingsDisplay) {
            if (count >= 2) {
                savingsDisplay.textContent = `💰 Ahorras $${discount.toLocaleString('es-CO')}`;
            } else {
                savingsDisplay.textContent = 'Selecciona 2+ para descuento';
            }
        }

        const whatsappNumber = appState.whatsapp ? appState.whatsapp.number : '573005965404';
        const message = `Quiero mi Combo de: ${selectedNames.join(', ')}. Precio: $${finalPrice.toLocaleString('es-CO')}`;
        btnUltimate.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        btnUltimate.dataset.selectedCount = count;
    }

    btnUltimate.addEventListener('click', function (e) {
        e.preventDefault();
        const count = parseInt(this.dataset.selectedCount || 0);
        if (count >= 2) {
            window.open(this.href, '_blank');
        } else {
            const savingsDisplay = document.querySelector('.combo-ultimate .combo-savings');
            if (savingsDisplay) {
                savingsDisplay.textContent = '❌ Elige 2+ para continuar';
                savingsDisplay.classList.add('error-shake');
                setTimeout(() => savingsDisplay.classList.remove('error-shake'), 400);
            }
        }
    });

    checkboxes.forEach(cb => {
        cb.removeEventListener('change', updateCombo);
        cb.addEventListener('change', updateCombo);
    });

    updateCombo();
}

// ===== HELPER: NORMALIZE PLATFORM NAME =====
function normalizePlatformName(name) {
    // Inverse mapping table since JSON keys don't always match simple lowercase rules
    // We try to match the HTML data-platform to the JSON key
    const mapping = {
        "Mubi": "mubi",
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

// ===== QUANTITY SELECTOR FOR PLATFORMS =====
function calculateDiscount(qty, type = 'profiles') {
    if (!appState.prices || !appState.prices.discounts[type]) return 0;
    const rules = appState.prices.discounts[type];
    
    // Direct match
    if (rules[qty]) return rules[qty];
    
    // Handle X+ keys
    let maxThreshold = -1;
    let maxValue = 0;
    for (const key of Object.keys(rules)) {
        if (key.endsWith('+')) {
            const threshold = parseInt(key);
            if (qty >= threshold && threshold > maxThreshold) {
                maxThreshold = threshold;
                maxValue = rules[key];
            }
        }
    }
    return maxValue;
}

function initCardLogic(card) {
    const monthMinus = card.querySelector('.month-minus');
    const monthPlus = card.querySelector('.month-plus');
    const monthValue = card.querySelector('.month-value');
    const profileMinus = card.querySelector('.qty-minus');
    const profilePlus = card.querySelector('.qty-plus');
    const profileValue = card.querySelector('.qty-value:not(.month-value)');
    const priceAmount = card.querySelector('.price-amount');
    const pricePerUnit = card.querySelector('.price-per-unit');
    const buyBtn = card.querySelector('.btn-buy');

    if (!profileMinus || !profilePlus || !profileValue || !buyBtn) return;

    const platform = card.getAttribute('data-platform');
    const basePrice = parseInt(card.getAttribute('data-price1m')) || 0;
    const MAX_QTY = parseInt(card.getAttribute('data-max-qty')) || 1;
    const MAX_MONTHS = parseInt(card.getAttribute('data-max-months')) || 1;

    let profiles = 1;
    let months = 1;

    function update() {
        profileValue.textContent = profiles;
        if (monthValue) monthValue.textContent = months;

        const profileDiscount = calculateDiscount(profiles, 'profiles');
        const monthDiscount = calculateDiscount(months, 'months');
        const totalDiscount = (profileDiscount * months) + (monthDiscount * profiles);

        let finalPrice;
        const platformKey = normalizePlatformName(platform);
        const platformData = appState.prices ? appState.prices.platforms[platformKey] : null;

        if (platformData && platformData.useCustomPricing && platformData.pricing && platformData.pricing[`${profiles}_profile`]) {
            const profilePricing = platformData.pricing[`${profiles}_profile`];
            finalPrice = profilePricing[`${months}_month`] || (profilePricing[`1_month`] * months) || (basePrice * profiles * months);
        } else {
            const totalBase = basePrice * profiles * months;
            finalPrice = totalBase - (totalDiscount || 0);
        }

        if (isNaN(finalPrice)) finalPrice = 0;

        if (priceAmount) priceAmount.textContent = `$${finalPrice.toLocaleString('es-CO')}`;

        if (pricePerUnit) {
            const isAccountBased = platform.toLowerCase().includes('account') || platform.toLowerCase().includes('google') || platform.toLowerCase().includes('canva');
            const unitName = isAccountBased ? 'cuenta' : 'perfil';
            let priceValue, unitLabel;
            if (months > 1 && profiles > 1) {
                priceValue = Math.round(finalPrice / profiles / months);
                unitLabel = `mes x ${unitName}`;
            } else if (months > 1) {
                priceValue = Math.round(finalPrice / months);
                unitLabel = 'mes';
            } else if (profiles > 1) {
                priceValue = Math.round(finalPrice / profiles);
                unitLabel = unitName;
            } else {
                priceValue = finalPrice;
                unitLabel = unitName;
            }
            pricePerUnit.textContent = `$${priceValue.toLocaleString('es-CO')}/${unitLabel}`;
        }

        const priceText = `$${finalPrice.toLocaleString('es-CO')}`;
        const monthsText = months > 1 ? `${months} Meses` : '1 Mes';
        const unitText = platform.toLowerCase().includes('account') ? 'cuentas' : 'perfiles';
        const message = `Quiero comprar ${platform} ${monthsText}${profiles > 1 ? ` (${profiles} ${unitText})` : ''} - Precio: ${priceText}`;
        const whatsappNumber = appState.whatsapp ? appState.whatsapp.number : '573005965404';
        buyBtn.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

        profileMinus.disabled = profiles <= 1;
        profilePlus.disabled = profiles >= MAX_QTY;
        if (monthMinus) monthMinus.disabled = months <= 1;
        if (monthPlus) monthPlus.disabled = months >= MAX_MONTHS;
    }

    profileMinus.addEventListener('click', (e) => { e.preventDefault(); if (profiles > 1) { profiles--; update(); } });
    profilePlus.addEventListener('click', (e) => { e.preventDefault(); if (profiles < MAX_QTY) { profiles++; update(); } });
    if (monthMinus && monthPlus) {
        monthMinus.addEventListener('click', (e) => { e.preventDefault(); if (months > 1) { months--; update(); } });
        monthPlus.addEventListener('click', (e) => { e.preventDefault(); if (months < MAX_MONTHS) { months++; update(); } });
    }
    update();
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
const isMobile = window.innerWidth <= 768;

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
        if (isMobile) {
            // On mobile: show all cards immediately
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        } else {
            // On desktop: animate on scroll
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(card);
        }
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
            const currentSection = sections[currentIndex];

            // Check if we're NOT at the top of the current section (with a small threshold)
            const scrollPosition = window.scrollY;
            const sectionTop = currentSection.offsetTop;
            const threshold = 100; // pixels tolerance

            if (scrollPosition > sectionTop + threshold) {
                // Not at the top of current section - scroll to top of current section
                currentSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                // At the top of current section - go to previous section
                const prevIndex = Math.max(0, currentIndex - 1);
                sections[prevIndex].scrollIntoView({ behavior: 'smooth' });
            }
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
    if (carouselImages.length > 0) {
        carouselImages.forEach(img => {
            img.addEventListener('click', () => openLightbox(img));
        });
    }

    // Initialize data from Supabase (this will also render platforms)
    loadData();
});
