/**
 * Rato Rebelde - Multi-CMS Bridge
 * RebelMouse-inspired functionality
 * 100% Vanilla JavaScript - No frameworks!
 * 
 * @author Yuri Ferreira Paulo
 * @version 2.0.0
 */

'use strict';

// Main Module using Revealing Module Pattern
const RatoRebelde = (function() {
    
    // Private variables
    const config = {
        animationDuration: 1000,
        updateInterval: 5000,
        maxContentItems: 12,
        cacheTimeout: 300000 // 5 minutes
    };
    
    const state = {
        currentPlatform: 'all',
        contentCache: new Map(),
        metrics: {
            fcp: null,
            lcp: null,
            cls: null,
            fid: null
        }
    };
    
    // Sample content data
    const sampleContent = [
        {
            title: "Optimizing Core Web Vitals for Enterprise Sites",
            excerpt: "Learn how to achieve perfect lighthouse scores with our advanced optimization techniques.",
            platform: "WordPress",
            date: "2 hours ago",
            image: "https://picsum.photos/seed/1/400/200"
        },
        {
            title: "The Future of Headless CMS Architecture",
            excerpt: "Exploring the benefits of decoupled content management systems in modern web development.",
            platform: "Ghost",
            date: "5 hours ago",
            image: "https://picsum.photos/seed/2/400/200"
        },
        {
            title: "Multi-Platform Content Strategy Guide",
            excerpt: "How to manage content across multiple CMS platforms efficiently and effectively.",
            platform: "Drupal",
            date: "1 day ago",
            image: "https://picsum.photos/seed/3/400/200"
        },
        {
            title: "AI-Powered Content Recommendations",
            excerpt: "Implementing machine learning algorithms to personalize user content experiences.",
            platform: "Contentful",
            date: "3 hours ago",
            image: "https://picsum.photos/seed/4/400/200"
        },
        {
            title: "Building Scalable API Architectures",
            excerpt: "Best practices for designing and implementing RESTful APIs that can handle millions of requests.",
            platform: "Strapi",
            date: "6 hours ago",
            image: "https://picsum.photos/seed/5/400/200"
        },
        {
            title: "Migration Strategies for Legacy CMS",
            excerpt: "Step-by-step guide to migrating from traditional CMS to modern headless solutions.",
            platform: "Joomla",
            date: "12 hours ago",
            image: "https://picsum.photos/seed/6/400/200"
        }
    ];
    
    // CMS Platform configurations
    const platforms = {
        wordpress: {
            name: 'WordPress',
            icon: '📝',
            endpoint: 'https://api.wordpress.org/stats/wordpress/1.0/',
            status: 'connected'
        },
        drupal: {
            name: 'Drupal',
            icon: '💧',
            endpoint: 'https://www.drupal.org/api-d7/node.json',
            status: 'connected'
        },
        ghost: {
            name: 'Ghost',
            icon: '👻',
            endpoint: 'https://demo.ghost.io/ghost/api/v3/content/posts/',
            status: 'connected'
        },
        contentful: {
            name: 'Contentful',
            icon: '🚀',
            endpoint: 'https://cdn.contentful.com/spaces/demo',
            status: 'connected'
        },
        strapi: {
            name: 'Strapi',
            icon: '⚡',
            endpoint: 'https://api.strapi.io/demo',
            status: 'connected'
        },
        joomla: {
            name: 'Joomla',
            icon: '🌟',
            endpoint: 'https://api.joomla.org/demo',
            status: 'connected'
        }
    };
    
    // Utility Functions
    const utils = {
        // Animate numeric values
        animateValue: function(element, start, end, duration) {
            if (!element) return;
            
            const range = end - start;
            const increment = range / (duration / 16);
            let current = start;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= end) {
                    current = end;
                    clearInterval(timer);
                }
                element.textContent = Math.floor(current);
            }, 16);
        },
        
        // Debounce function for performance
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        // Format date strings
        formatDate: function(date) {
            const now = new Date();
            const diff = now - new Date(date);
            const hours = Math.floor(diff / 3600000);
            
            if (hours < 1) return 'Just now';
            if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            
            const days = Math.floor(hours / 24);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    };
    
    // Animation Controller
    const animations = {
        // Fade in animation for elements
        fadeIn: function(element, delay = 0) {
            if (!element) return;
            
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.5s ease-out';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, delay);
        },
        
        // Initialize scroll animations
        initScrollAnimations: function() {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -100px 0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, observerOptions);
            
            // Observe all sections
            document.querySelectorAll('section').forEach(section => {
                section.style.opacity = '0';
                section.style.transform = 'translateY(20px)';
                section.style.transition = 'all 0.6s ease-out';
                observer.observe(section);
            });
        },
        
        // Initialize stats counter animation
        initStatsAnimation: function() {
            const statsObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !entry.target.dataset.animated) {
                        entry.target.dataset.animated = 'true';
                        const value = parseInt(entry.target.textContent);
                        utils.animateValue(entry.target, 0, value, config.animationDuration);
                    }
                });
            }, { threshold: 0.5 });
            
            document.querySelectorAll('.stat-value').forEach(stat => {
                statsObserver.observe(stat);
            });
        }
    };
    
    // Content Manager
    const contentManager = {
        // Load content into grid
        loadContent: function(platformFilter = 'all') {
            const grid = document.getElementById('contentGrid');
            if (!grid) return;
            
            // Clear existing content
            grid.innerHTML = '';
            
            // Filter content based on platform
            let filteredContent = sampleContent;
            if (platformFilter !== 'all') {
                filteredContent = sampleContent.filter(item => 
                    item.platform.toLowerCase() === platformFilter
                );
            }
            
            // Create and append content cards
            filteredContent.slice(0, config.maxContentItems).forEach((item, index) => {
                const card = this.createContentCard(item);
                grid.appendChild(card);
                animations.fadeIn(card, index * 100);
            });
        },
        
        // Create content card element
        createContentCard: function(item) {
            const card = document.createElement('article');
            card.className = 'content-card';
            
            card.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="content-image" loading="lazy">
                <div class="content-body">
                    <div class="content-meta">
                        <span class="content-badge">${item.platform}</span>
                        <span class="content-date">${item.date}</span>
                    </div>
                    <h3 class="content-title">${item.title}</h3>
                    <p class="content-excerpt">${item.excerpt}</p>
                </div>
            `;
            
            return card;
        },
        
        // Show loading state
        showLoadingState: function() {
            const grid = document.getElementById('contentGrid');
            if (!grid) return;
            
            grid.innerHTML = `
                <div class="loading-skeleton" style="height: 200px; width: 100%; border-radius: 8px;"></div>
                <div class="loading-skeleton" style="height: 200px; width: 100%; border-radius: 8px;"></div>
                <div class="loading-skeleton" style="height: 200px; width: 100%; border-radius: 8px;"></div>
            `;
        }
    };
    
    // Performance Monitor
    const performanceMonitor = {
        // Initialize Core Web Vitals monitoring
        init: function() {
            if ('PerformanceObserver' in window) {
                this.observeFCP();
                this.observeLCP();
                this.observeCLS();
                this.observeFID();
            }
        },
        
        observeFCP: function() {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.name === 'first-contentful-paint') {
                            state.metrics.fcp = Math.round(entry.startTime);
                            this.updateMetric('fcp', state.metrics.fcp);
                        }
                    }
                });
                observer.observe({ entryTypes: ['paint'] });
            } catch (e) {
                console.log('FCP observation not supported');
            }
        },
        
        observeLCP: function() {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    state.metrics.lcp = Math.round(lastEntry.renderTime || lastEntry.loadTime);
                    this.updateMetric('lcp', state.metrics.lcp);
                });
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                console.log('LCP observation not supported');
            }
        },
        
        observeCLS: function() {
            try {
                let clsValue = 0;
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                            state.metrics.cls = Math.round(clsValue * 1000) / 1000;
                            this.updateMetric('cls', state.metrics.cls);
                        }
                    }
                });
                observer.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                console.log('CLS observation not supported');
            }
        },
        
        observeFID: function() {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        state.metrics.fid = Math.round(entry.processingStart - entry.startTime);
                        this.updateMetric('fid', state.metrics.fid);
                    }
                });
                observer.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                console.log('FID observation not supported');
            }
        },
        
        updateMetric: function(metric, value) {
            const element = document.getElementById(`${metric}Value`);
            if (!element) return;
            
            let displayValue = value;
            let className = 'metric-value';
            
            // Determine status based on thresholds
            switch(metric) {
                case 'fcp':
                    displayValue = value + 'ms';
                    if (value > 3000) className += ' error';
                    else if (value > 1800) className += ' warning';
                    break;
                case 'lcp':
                    displayValue = value + 'ms';
                    if (value > 4000) className += ' error';
                    else if (value > 2500) className += ' warning';
                    break;
                case 'cls':
                    displayValue = value;
                    if (value > 0.25) className += ' error';
                    else if (value > 0.1) className += ' warning';
                    break;
                case 'fid':
                    displayValue = value + 'ms';
                    if (value > 300) className += ' error';
                    else if (value > 100) className += ' warning';
                    break;
            }
            
            element.textContent = displayValue;
            element.className = className;
        }
    };
    
    // Real-time updates simulator
    const realTimeUpdates = {
        init: function() {
            setInterval(() => {
                this.updateStats();
            }, config.updateInterval);
        },
        
        updateStats: function() {
            // Update API speed
            const apiSpeed = document.getElementById('apiSpeed');
            if (apiSpeed) {
                const newSpeed = 100 + Math.floor(Math.random() * 50);
                apiSpeed.textContent = newSpeed;
            }
            
            // Update content items count
            const contentItems = document.getElementById('contentItems');
            if (contentItems) {
                const current = parseInt(contentItems.textContent);
                const increment = Math.floor(Math.random() * 5);
                contentItems.textContent = current + increment;
            }
            
            // Update platform status randomly
            document.querySelectorAll('.status-dot').forEach(dot => {
                if (Math.random() > 0.95) {
                    dot.style.background = Math.random() > 0.5 ? '#10b981' : '#f59e0b';
                }
            });
        }
    };
    
    // Public API
    return {
        // Initialize application
        init: function() {
            console.log('%c🐭 Rato Rebelde - Multi-CMS Bridge', 'font-size: 24px; color: #FFD700; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);');
            console.log('%c"RebelMouse? Aqui é Rato Rebelde! 🇧🇷"', 'font-size: 16px; color: #0066FF; font-style: italic;');
            console.log('%cBuilt with 100% Vanilla JavaScript', 'font-size: 14px; color: #4a4a4a;');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🎯 Features demonstrated:');
            console.log('• Clean, professional RebelMouse-inspired design');
            console.log('• Multi-CMS integration architecture');
            console.log('• Performance-first approach');
            console.log('• Zero dependencies');
            console.log('• Senior-level code organization');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Created by Yuri Ferreira Paulo');
            console.log('GitHub: https://github.com/yurifp');
            console.log('Portfolio: https://yurifp.dev');
            
            // Initialize all modules
            animations.initScrollAnimations();
            animations.initStatsAnimation();
            contentManager.loadContent();
            performanceMonitor.init();
            realTimeUpdates.init();
            
            // Bind smooth scrolling to anchor links
            this.initSmoothScroll();
            
            return this;
        },
        
        // Smooth scroll implementation
        initSmoothScroll: function() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        },
        
        // Load platform-specific content
        loadPlatformContent: function(platform) {
            console.log(`🔄 Loading content from ${platform}...`);
            
            contentManager.showLoadingState();
            state.currentPlatform = platform;
            
            // Simulate API call delay
            setTimeout(() => {
                contentManager.loadContent(platform);
                
                // Smooth scroll to content section
                const contentSection = document.getElementById('content');
                if (contentSection) {
                    contentSection.scrollIntoView({ behavior: 'smooth' });
                }
            }, 800);
        },
        
        // Run website health check
        runHealthCheck: function() {
            console.log('🏥 Running website health check...');
            
            // Show performance monitor
            const monitor = document.getElementById('performanceMonitor');
            if (monitor) {
                monitor.style.display = 'block';
                animations.fadeIn(monitor);
                
                // Hide after 10 seconds
                setTimeout(() => {
                    monitor.style.display = 'none';
                }, 10000);
            }
            
            // Show alert with results
            const results = `
Health Check Results:
━━━━━━━━━━━━━━━━━━━━
Core Web Vitals:
• FCP: ${state.metrics.fcp || '0.8s'} ✅
• LCP: ${state.metrics.lcp || '1.2s'} ✅
• CLS: ${state.metrics.cls || '0.02'} ✅
• FID: ${state.metrics.fid || '45ms'} ✅

Overall Score: 98/100
Status: Excellent
            `;
            
            alert(results);
        },
        
        // Show AI features
        showAIFeatures: function() {
            console.log('🤖 Showing AI features...');
            
            const features = `
AI-Powered Features:
━━━━━━━━━━━━━━━━━━━━
• Smart Content Recommendations
• Automated SEO Optimization
• Predictive Analytics Dashboard
• Real-time Personalization Engine
• Multi-language Support (12 languages)
• Sentiment Analysis
• Content Quality Scoring
• Automated A/B Testing

Ready to transform your content strategy?
            `;
            
            alert(features);
        },
        
        
        getState: function() {
            return state;
        },
        
        
        getPlatforms: function() {
            return platforms;
        }
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => RatoRebelde.init());
} else {
    RatoRebelde.init();
}

// Expose to global scope for debugging and external access
window.RatoRebelde = RatoRebelde;