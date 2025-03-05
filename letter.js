document.addEventListener('DOMContentLoaded', function() {
    // Get selected envelope from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const selectedEnvelope = urlParams.get('selectedEnvelope');
    
    // Redirect back to envelope selection if no envelope was selected
    if (selectedEnvelope === null) {
        window.location.href = 'envelopes.html';
        return;
    }
    
    // Canvas setup
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const textOverlay = document.getElementById('textOverlay');
    const toolButtons = document.querySelectorAll('.tool');
    const emojiPicker = document.getElementById('emojiPicker');
    const photoInput = document.getElementById('photoInput');
    
    // Set canvas size
    function resizeCanvas() {
      const letterContainer = document.querySelector('.letter-container');
      const header = document.querySelector('.letter-header');
      const tools = document.querySelector('.tools-container');
      
      const canvasHeight = letterContainer.offsetHeight - header.offsetHeight - tools.offsetHeight;
      
      canvas.width = letterContainer.offsetWidth;
      canvas.height = canvasHeight;
      
      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Initialize canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Drawing state
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentTool = 'pencil';
    
    // Sound effects
    const drawSound = new Audio('assets/sounds/pencil.mp3');
    drawSound.volume = 0.2;
    
    const eraserSound = new Audio('assets/sounds/eraser.mp3');
    eraserSound.volume = 0.2;
    
    // Tool handlers
    const tools = {
      pencil: {
        draw: function(x, y) {
          if (!drawSound.paused && drawSound.currentTime > 0) {
            // Sound already playing, don't restart
          } else {
            drawSound.play();
          }
          
          ctx.beginPath();
          ctx.moveTo(lastX, lastY);
          ctx.lineTo(x, y);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      },
      eraser: {
        draw: function(x, y) {
          if (!eraserSound.paused && eraserSound.currentTime > 0) {
            // Sound already playing, don't restart
          } else {
            eraserSound.play();
          }
          
          const eraserSize = 20;
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(x, y, eraserSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    
    // Drawing event handlers
    function startDrawing(e) {
      // Only draw with pencil or eraser
      if (currentTool !== 'pencil' && currentTool !== 'eraser') return;
      
      isDrawing = true;
      
      // Get pointer position
      const rect = canvas.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
      
      // For touch events
      if (e.touches && e.touches[0]) {
        lastX = e.touches[0].clientX - rect.left;
        lastY = e.touches[0].clientY - rect.top;
      }
    }
    
    function draw(e) {
      if (!isDrawing) return;
      if (currentTool !== 'pencil' && currentTool !== 'eraser') return;
      
      e.preventDefault();
      
      // Get current pointer position
      const rect = canvas.getBoundingClientRect();
      let currentX = e.clientX - rect.left;
      let currentY = e.clientY - rect.top;
      
      // For touch events
      if (e.touches && e.touches[0]) {
        currentX = e.touches[0].clientX - rect.left;
        currentY = e.touches[0].clientY - rect.top;
      }
      
      // Use the appropriate tool
      tools[currentTool].draw(currentX, currentY);
      
      // Update last position
      lastX = currentX;
      lastY = currentY;
    }
    
    function stopDrawing() {
      isDrawing = false;
      drawSound.pause();
      drawSound.currentTime = 0;
      eraserSound.pause();
      eraserSound.currentTime = 0;
    }
    
    // Add event listeners for drawing
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events
    canvas.addEventListener('touchstart', function(e) {
      e.preventDefault();
      startDrawing(e);
    }, { passive: false });
    
    canvas.addEventListener('touchmove', function(e) {
      e.preventDefault();
      draw(e);
    }, { passive: false });
    
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);
    
    // Tool selection
    toolButtons.forEach(button => {
      button.addEventListener('click', function() {
        const tool = this.dataset.tool;
        
        // Remove selected class from all tools
        toolButtons.forEach(btn => btn.classList.remove('selected'));
        
        // Add selected class to clicked tool
        this.classList.add('selected');
        
        // Set current tool
        currentTool = tool;
        
        // Hide emoji picker when switching tools
        emojiPicker.classList.remove('active');
        
        // Handle special tool actions
        if (tool === 'text') {
          addTextBox();
        } else if (tool === 'emoji') {
          toggleEmojiPicker();
        } else if (tool === 'photo') {
          photoInput.click();
        }
        
        // Make text overlay active when using text tool
        if (tool === 'text') {
          textOverlay.classList.add('active');
        } else {
          textOverlay.classList.remove('active');
        }
      });
    });
    
    // Text functionality
    function addTextBox() {
      const textItem = document.createElement('div');
      textItem.className = 'text-item';
      textItem.contentEditable = true;
      
      // Random position in the middle area of canvas
      const randomX = canvas.width * 0.3 + Math.random() * (canvas.width * 0.4);
      const randomY = canvas.height * 0.3 + Math.random() * (canvas.height * 0.4);
      
      textItem.style.left = randomX + 'px';
      textItem.style.top = randomY + 'px';
      
      textOverlay.appendChild(textItem);
      
      // Focus on the new text box
      setTimeout(() => {
        textItem.focus();
      }, 10);
      
      // Make text draggable
      makeElementDraggable(textItem);
    }
    
    // Emoji functionality
    function toggleEmojiPicker() {
      emojiPicker.classList.toggle('active');
    }
    
    // Add emoji to canvas when clicked
    document.querySelectorAll('.emoji-item').forEach(emoji => {
      emoji.addEventListener('click', function() {
        const emojiText = this.innerText;
        
        // Create emoji element
        const emojiElement = document.createElement('div');
        emojiElement.className = 'text-item';
        emojiElement.innerText = emojiText;
        emojiElement.style.fontSize = '32px';
        
        // Random position
        const randomX = canvas.width * 0.3 + Math.random() * (canvas.width * 0.4);
        const randomY = canvas.height * 0.3 + Math.random() * (canvas.height * 0.4);
        
        emojiElement.style.left = randomX + 'px';
        emojiElement.style.top = randomY + 'px';
        
        textOverlay.appendChild(emojiElement);
        
        // Hide emoji picker
        emojiPicker.classList.remove('active');
        
        // Make emoji draggable
        makeElementDraggable(emojiElement);
      });
    });
    
    // Photo functionality
    photoInput.addEventListener('change', function(e) {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
          addPhotoToCanvas(event.target.result);
        };
        
        reader.readAsDataURL(file);
      }
    });
    
    function addPhotoToCanvas(imageSrc) {
      // Create photo container
      const photoContainer = document.createElement('div');
      photoContainer.className = 'photo-preview';
      
      // Position in the center
      photoContainer.style.left = (canvas.width / 2 - 100) + 'px';
      photoContainer.style.top = (canvas.height / 2 - 100) + 'px';
      photoContainer.style.width = '200px';
      photoContainer.style.height = '200px';
      
      // Create image element
      const img = document.createElement('img');
      img.src = imageSrc;
      photoContainer.appendChild(img);
      
      // Add delete button
      const deleteBtn = document.createElement('div');
      deleteBtn.className = 'delete-btn';
      deleteBtn.innerText = '×';
      deleteBtn.addEventListener('click', () => {
        photoContainer.remove();
      });
      
      photoContainer.appendChild(deleteBtn);
      textOverlay.appendChild(photoContainer);
      
      // Make photo draggable
      makeElementDraggable(photoContainer);
    }
    
    // Make elements draggable
    function makeElementDraggable(element) {
      let offsetX, offsetY, isDragging = false;
      
      element.addEventListener('mousedown', startDrag);
      element.addEventListener('touchstart', function(e) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
          clientX: touch.clientX,
          clientY: touch.clientY
        });
        startDrag(mouseEvent);
      }, { passive: false });
      
      function startDrag(e) {
        if (e.target.className === 'delete-btn') return;
        
        // If it's a text element, don't start dragging if the user is trying to edit text
        if (element.contentEditable === 'true' && e.target === element) {
          // Only start dragging if the element is already focused
          if (document.activeElement !== element) {
            return;
          }
        }
        
        isDragging = true;
        
        const rect = element.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        
        document.addEventListener('touchmove', function(e) {
          const touch = e.touches[0];
          const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
          });
          drag(mouseEvent);
        }, { passive: false });
        
        document.addEventListener('touchend', function() {
          stopDrag();
        });
      }
      
      function drag(e) {
        if (!isDragging) return;
        
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        
        // Keep the element within the canvas bounds
        const maxX = textOverlay.offsetWidth - element.offsetWidth;
        const maxY = textOverlay.offsetHeight - element.offsetHeight;
        
        element.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
        element.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
      }
      
      function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
      }
    }
    
    // Prevent default behavior for touch events
    document.addEventListener('touchmove', function(e) {
      if (e.target.tagName !== 'CANVAS' && !e.target.classList.contains('text-item') && !e.target.classList.contains('photo-preview')) {
        e.preventDefault();
      }
    }, { passive: false });
  });