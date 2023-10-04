document.addEventListener('DOMContentLoaded', function() {
    var navItems = document.querySelectorAll('.nav_room a');
    var currentPath = window.location.pathname;
  
    navItems.forEach(function(item) {
      if (item.getAttribute('href') === currentPath) {
        item.parentNode.classList.add('active');
      } else {
        item.parentNode.classList.remove('active');
      }
    });
  });
  