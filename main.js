/**
 * The Frame Guru - Main JavaScript File
 * Version: 1.0
 */

document.addEventListener('DOMContentLoaded', function() {
  // Mobile Navigation Toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const body = document.body;
  
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      body.classList.toggle('menu-open');
    });
  }
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', function(event) {
    if (body.classList.contains('menu-open') && 
        !event.target.closest('.main-nav') && 
        !event.target.closest('.menu-toggle')) {
      body.classList.remove('menu-open');
    }
  });
  
  // Form Validation
  const contactForm = document.querySelector('#contact-form');
  const orderForm = document.querySelector('#order-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', validateForm);
  }
  
  if (orderForm) {
    orderForm.addEventListener('submit', validateForm);
  }
  
  function validateForm(event) {
    let valid = true;
    const requiredFields = this.querySelectorAll('[required]');
    
    // Reset previous error messages
    const errorMessages = this.querySelectorAll('.error-message');
    errorMessages.forEach(el => el.remove());
    
    // Check each required field
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        valid = false;
        showError(field, 'This field is required');
      } else if (field.type === 'email' && !isValidEmail(field.value)) {
        valid = false;
        showError(field, 'Please enter a valid email address');
      }
    });
    
    if (!valid) {
      event.preventDefault();
    }
  }
  
  function showError(field, message) {
    // Remove any existing error
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = 'red';
    errorDiv.style.fontSize = '1.2rem';
    errorDiv.style.marginTop = '0.5rem';
    
    // Insert error after the field
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
    
    // Highlight field
    field.style.borderColor = 'red';
    
    // Remove highlight when user starts typing
    field.addEventListener('input', function() {
      this.style.borderColor = '';
      const error = this.parentNode.querySelector('.error-message');
      if (error) {
        error.remove();
      }
    }, { once: true });
  }
  
  function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  
  // Smooth scrolling for anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
  
  anchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        e.preventDefault();
        window.scrollTo({
          top: targetElement.offsetTop - 100,
          behavior: 'smooth'
        });
        
        // Update URL without page jump
        history.pushState(null, null, targetId);
      }
    });
  });
  
  // Lazy load images
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(image => {
      imageObserver.observe(image);
    });
  } else {
    // Fallback for browsers without IntersectionObserver support
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    lazyImages.forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }
  
  // Simple animation for page elements
  const animatedElements = document.querySelectorAll('.fade-in');
  
  function checkInView() {
    animatedElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      const elementVisible = 150;
      
      if (elementTop < window.innerHeight - elementVisible) {
        element.classList.add('active');
      }
    });
  }
  
  // Run on page load
  checkInView();
  
  // Run on scroll
  window.addEventListener('scroll', checkInView);
});
