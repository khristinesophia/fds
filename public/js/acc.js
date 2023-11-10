document.addEventListener('DOMContentLoaded', function() {
    // Check if Bootstrap's collapse functionality is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
      const accordionToggle = document.querySelector('.accordion-toggle.nav-item');
      const accordionContent = document.querySelector('#accordionContent');
  
      if (accordionContent && accordionToggle) {
        // When the accordion opens, add 'accordion-active' class
        accordionContent.addEventListener('show.bs.collapse', function() {
          accordionToggle.classList.add('accordion-active');
        });
  
        // When the accordion closes, remove 'accordion-active' class
        accordionContent.addEventListener('hide.bs.collapse', function() {
          accordionToggle.classList.remove('accordion-active');
        });
      }
    }
  });
  