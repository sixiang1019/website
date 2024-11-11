document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.carousel-container');
    const slides = document.querySelectorAll('.carousel-slide');
    const prevButton = document.querySelector('.carousel-button.prev');
    const nextButton = document.querySelector('.carousel-button.next');
    
    let currentSlide = 0;
    const slideCount = slides.length;
    
    function updateCarousel() {
        carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slideCount;
        updateCarousel();
    }
    
    function prevSlide() {
        currentSlide = (currentSlide - 1 + slideCount) % slideCount;
        updateCarousel();
    }
    
    // 添加按钮事件监听
    nextButton.addEventListener('click', nextSlide);
    prevButton.addEventListener('click', prevSlide);
    
    // 自动轮播
    let autoSlide = setInterval(nextSlide, 5000);
    
    // 鼠标悬停时暂停自动轮播
    carousel.addEventListener('mouseenter', () => clearInterval(autoSlide));
    carousel.addEventListener('mouseleave', () => autoSlide = setInterval(nextSlide, 5000));

    // 平滑滚动导航
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // 图片放大查看功能
    const galleryImages = document.querySelectorAll('.nature-photo img, .history-photo img');
    const modal = createImageModal();

    galleryImages.forEach(img => {
        img.addEventListener('click', () => {
            modal.showImage(img.src, img.alt);
        });
    });

    // 添加滚动动画效果
    const animatedElements = document.querySelectorAll('.timeline-item, .nature-photo, .history-photo');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => observer.observe(el));
});

// 创建图片查看模态框
function createImageModal() {
    const modalHTML = `
        <div class="image-modal" style="display: none;">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <img src="" alt="">
                <div class="modal-caption"></div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.querySelector('.image-modal');
    const modalImg = modal.querySelector('img');
    const modalCaption = modal.querySelector('.modal-caption');
    const closeBtn = modal.querySelector('.close-modal');

    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };

    return {
        showImage: (src, alt) => {
            modal.style.display = 'flex';
            modalImg.src = src;
            modalCaption.textContent = alt;
        }
    };
} 