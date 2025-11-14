const bgIcon = document.querySelector('.background-icon');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  bgIcon.style.transform = `translateX(-50%) translateY(${scrollY * 0.3}px)`; 
  // 0.3 = speed factor, smaller = slower for subtle effect
});
