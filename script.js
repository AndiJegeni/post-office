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
  
  let selectedEnvelope = null;
  
  // Initialize the app when the DOM is fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded");
    
    const container = document.getElementById('envelope-container');
    const nextButton = document.getElementById('next-button');
    
    if (!container) {
      console.error("Could not find envelope container!");
      return;
    }
    
    console.log("Found container:", container);
    
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
        
        // Add click handler
        envelopeEl.onclick = function() {
          console.log('Envelope clicked:', envelope.id);
          selectEnvelope(envelope.id);
        };
        
        container.appendChild(envelopeEl);
        console.log('Added envelope:', envelope.id);
      });
      
      console.log('Total envelopes created:', envelopes.length);
    }
    
    // Handle envelope selection
    function selectEnvelope(id) {
      console.log('Selecting envelope:', id);
      selectedEnvelope = parseInt(id);
      
      // Update selected state for all envelopes
      document.querySelectorAll('.envelope').forEach(env => {
        const envId = parseInt(env.dataset.id);
        console.log('Checking envelope:', envId, 'against selected:', selectedEnvelope);
        if (envId === selectedEnvelope) {
          env.classList.add('selected');
          console.log('Added selected class to envelope:', envId);
        } else {
          env.classList.remove('selected');
        }
      });
      
      // Enable next button when an envelope is selected
      if (nextButton) {
        nextButton.disabled = false;
        console.log('Next button enabled');
      }
    }
    
    // Create the envelopes
    createEnvelopes();
    
    // Add touch event handlers for mobile
    document.querySelectorAll('.envelope').forEach(env => {
      env.addEventListener('touchstart', function(e) {
        console.log('Touch start on envelope:', env.dataset.id);
        // Prevent default touch behavior
        e.preventDefault();
        // Trigger click on touch
        selectEnvelope(env.dataset.id);
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
        console.log('Next button clicked');
        if (selectedEnvelope !== null) {
          console.log('Navigating to letter page with envelope:', selectedEnvelope);
          window.location.href = `letter.html?selectedEnvelope=${selectedEnvelope}`;
        }
      });
    } else {
      console.error("Could not find next button!");
    }
    
    // Add click handler to container as well (event delegation)
    container.addEventListener('click', function(e) {
      const envelope = e.target.closest('.envelope');
      if (envelope) {
        console.log('Envelope clicked through delegation:', envelope.dataset.id);
        selectEnvelope(envelope.dataset.id);
      }
    });
  });