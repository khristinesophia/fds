const currentPath = window.location.pathname;

// Find the navigation item (parent of the nav-link) that matches the current path or its parent path and add the "active" class
document.querySelectorAll('.nav-item').forEach((item) => {
  const link = item.querySelector('.nav-link');
  const href = link.getAttribute('href');
  if (href === currentPath || currentPath.startsWith(href)) {
    item.classList.add('active');
  }
});


/*document.addEventListener('DOMContentLoaded', function() {
  const navItems = document.querySelectorAll('.nav-ite');

  navItems.forEach(item => {
    item.addEventListener('click', function() {
      this.classList.toggle('active');
    });
  });
});*/
