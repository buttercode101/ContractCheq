// Add a function to show/hide paid features
function togglePaidFeatures() {
  const paidFeatures = document.querySelectorAll('.paid-feature')
  const unlockButton = document.getElementById('unlock-report')
  
  if (unlockButton && unlockButton.textContent.includes('Unlock')) {
    paidFeatures.forEach(feature => {
      feature.style.display = 'none'
    })
  } else {
    paidFeatures.forEach(feature => {
      feature.style.display = 'block'
    })
  }
}

// Call this function when the page loads
window.addEventListener('DOMContentLoaded', togglePaidFeatures)
