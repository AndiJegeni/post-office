// Envelope data
const envelopes = [
    {
      id: 0,
      colors: {
        light: "#f5f4e4", // Cream light
        medium: "#e9e3d2", // Cream medium
        dark: "#ded8ca", // Cream dark
      },
    },
    {
      id: 1,
      colors: {
        light: "#f8a5c2", // Pink light
        medium: "#f06292", // Pink medium
        dark: "#e84a7f", // Pink dark
      },
    },
    {
      id: 2,
      colors: {
        light: "#56aef4", // Blue light
        medium: "#3592dc", // Blue medium
        dark: "#3188ce", // Blue dark
      },
    },
    {
      id: 3,
      colors: {
        light: "#ff5d60", // Red light
        medium: "#f93b3f", // Red medium
        dark: "#df383b", // Red dark
      },
    },
  ];
  
  let selectedEnvelope = null; // Changed to null to indicate no initial selection
  
  // Initialize the app when the DOM is fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded");
    
    const container = document.getElementById('envelope-container');
    const nextButton = document.getElementById('next-button');
    
    if (!container) {
      console.error("Could not find envelope container!");
      return;
    }
    
    // Disable next button initially
    if (nextButton) {
      nextButton.disabled = true;
    }
    
    // Create envelope elements
    function createEnvelopes() {
      console.log("Creating envelopes");
      container.innerHTML = ''; // Clear container first
      
      envelopes.forEach(envelope => {
        const envelopeEl = document.createElement('div');
        envelopeEl.className = `envelope ${envelope.id === selectedEnvelope ? 'selected' : ''}`;
        envelopeEl.dataset.id = envelope.id;
        
        envelopeEl.innerHTML = `
          <div class="envelope-body" style="background-color: ${envelope.colors.medium}">
            <div class="left-triangle" style="background-color: ${envelope.colors.dark}"></div>
            <div class="right-triangle" style="background-color: ${envelope.colors.dark}"></div>
            <div class="top-flap" style="background-color: ${envelope.colors.light}"></div>
          </div>
        `;
        
        envelopeEl.addEventListener('click', () => selectEnvelope(envelope.id));
        container.appendChild(envelopeEl);
      });
    }
    
    // Handle envelope selection
    function selectEnvelope(id) {
      selectedEnvelope = parseInt(id);
      
      // Update selected state for all envelopes
      document.querySelectorAll('.envelope').forEach(env => {
        if (parseInt(env.dataset.id) === selectedEnvelope) {
          env.classList.add('selected');
        } else {
          env.classList.remove('selected');
        }
      });
      
      // Enable next button when an envelope is selected
      if (nextButton) {
        nextButton.disabled = false;
      }
    }
    
    // Create the envelopes
    createEnvelopes();
    
    // Add touch event handlers for mobile
    document.querySelectorAll('.envelope').forEach(env => {
      env.addEventListener('touchstart', function(e) {
        // Prevent default touch behavior
        e.preventDefault();
      }, { passive: false });
    });
    
    // Prevent zooming on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
    
    // Set up the Next button
    if (nextButton) {
      nextButton.addEventListener('click', function() {
        if (selectedEnvelope !== null) {
          // Navigate to the letter page with the selected envelope as a parameter
          window.location.href = `letter.html?selectedEnvelope=${selectedEnvelope}`;
        }
      });
    } else {
      console.error("Could not find next button!");
    }
  });