/*    
    var current = 0;
    var tabs = $(".tab");
    var tabs_pill = $(".tab-pills");

    loadFormData(current);

    function loadFormData(n) {
      $(tabs_pill[n]).addClass("active");
      $(tabs[n]).removeClass("d-none");
      $("#back_button").attr("disabled", n == 0 ? true : false);
      n == tabs.length - 1
        ? $("#next_button").text("Submit").removeAttr("onclick")
        : $("#next_button")
            .attr("type", "button")
            .text("Next")
            .attr("onclick", "next()");
    }

    function next() {
      $(tabs[current]).addClass("d-none");
      $(tabs_pill[current]).removeClass("active");

      current++;
      loadFormData(current);
    }

    function back() {
      $(tabs[current]).addClass("d-none");
      $(tabs_pill[current]).removeClass("active");

      current--;
      loadFormData(current);
    }
  */
    var current = 0;
    var tabs = $(".tab");
    var tabs_pill = $(".tab-pills");
    var isLastTab = false;
    
    loadFormData(current);
    
    function loadFormData(n) {
      $(tabs_pill).removeClass("active");
      $(tabs).addClass("d-none");
    
      $(tabs_pill[n]).addClass("active");
      $(tabs[n]).removeClass("d-none");
    
      $("#back_button").attr("disabled", n === 0);
    
      isLastTab = n === tabs.length - 1;
    
      if (isLastTab) {
        $("#next_button")
          .attr("type", "button")
          .text("Submit")
          .removeAttr("onclick")
          .on("click", submitForm);
      } else {
        $("#next_button")
          .attr("type", "button")
          .text("Next")
          .attr("onclick", "next()")
          .off("click", submitForm);
      }
    }
    
    function next() {
      $(tabs[current]).addClass("d-none");
      $(tabs_pill[current]).removeClass("active");
    
      current++;
      loadFormData(current);
    }
    
    function back() {
      $(tabs[current]).addClass("d-none");
      $(tabs_pill[current]).removeClass("active");
    
      current--;
      loadFormData(current);
    }
    
    function submitForm() {
      // You can add form validation or any other necessary logic here
      // For now, I'll just submit the form
      $("form").submit();
    }
    
