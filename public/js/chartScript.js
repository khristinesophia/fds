document.addEventListener('DOMContentLoaded', function() {
    var ctx = document.getElementById('donutChart').getContext('2d');
  
    var data = {
      labels: ['Adult', 'Children'],
      datasets: [{
        data: [adultNoCount, childNoCount],
        backgroundColor: ['#36a2eb', '#ff6384'],
        borderWidth: 1
      }]
    };
  
    var options = {
      cutoutPercentage: 70,
      responsive: true,
      maintainAspectRatio: false,
    };
  
    var myDoughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: data,
      options: options
    });
  });
  