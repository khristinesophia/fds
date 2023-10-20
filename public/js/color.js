// Assuming you have the select element and label element in your HTML
var selectElement = document.getElementById('hotelcolor');
var currentlyColorLabel = document.querySelector('label.currently-color');

// Add an event listener to the select element to update the label
selectElement.addEventListener('change', function() {
    var selectedColor = selectElement.value;
    currentlyColorLabel.textContent = selectedColor;
});
