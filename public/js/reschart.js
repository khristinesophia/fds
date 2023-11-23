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
  
      var dataReservation = {
        labels: roomTypeLabels,
        datasets: [{
          data: roomTypeCounts,
          backgroundColor: getRandomColorsDark(roomTypeLabels.length),
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
  
    // Function to generate random colors
    function getRandomColorsDark(count) {
      var colors = [];
      for (var i = 0; i < count; i++) {
        colors.push(getRandomDarkColor());
      }
      return colors;
    }
  
    // Function to generate a random color
    function getRandomDarkColor() {
      var letters = '0123456789ABCDEF';
      var color = '#';
      for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }