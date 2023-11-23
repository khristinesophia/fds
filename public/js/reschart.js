document.addEventListener('DOMContentLoaded', function() {


  var roomTypeLabels = reservations.map(function(r) {
      return r.roomtype;
  });

  var roomTypeCounts = reservations.map(function(r) {
      return r.roomtype_count;
  });

  var totalReservations = roomTypeCounts.reduce(function(acc, count) {
      return acc + count;
  }, 0);

  document.getElementById('reservationCount').textContent = 'Total Reservations: ' + totalReservations;

  var ctxReservation = document.getElementById('reservationDonutChart').getContext('2d');

  // Define an array of 15 dark colors
  var predefinedColors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
      '#334455', '#8899aa', '#dd4477', '#117733', '#aa88cc'
  ];

  var dataReservation = {
      labels: roomTypeLabels,
      datasets: [{
          data: roomTypeCounts,
          backgroundColor: predefinedColors,
          borderWidth: 1
      }]
  };

  var optionsReservation = {
      cutoutPercentage: 70,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
          legend: {
              position: 'right',
              labels: {
                  font: {
                      size: 14,
                      weight: 'bold'
                  }
              }
          },
      },
  };

  var myReservationDoughnutChart = new Chart(ctxReservation, {
      type: 'doughnut',
      data: dataReservation,
      options: optionsReservation
  });

});
