// Smooth scrolling for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const navHeight = document.querySelector('.navbar').offsetHeight;
            window.scrollTo({
                top: target.offsetTop - navHeight,
                behavior: 'smooth'
            });
        }
    });
});

// Close mobile nav after clicking
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        const navCollapse = document.querySelector('.navbar-collapse');
        if (navCollapse.classList.contains('show')) {
            navCollapse.classList.remove('show');
        }
    });
});

d3.csv('data/YearAndGeneration.csv').then(data => {
    const energyChart = new EnergyGrowth('viz-renewable-percentage', data);
});

d3.csv('data/vis1.csv').then(data => {
    const renewableChart = new RenewableGrowth('viz-population-demand', data);
});

