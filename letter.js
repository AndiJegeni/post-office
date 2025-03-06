document.addEventListener('DOMContentLoaded', function() {
    // Get selected envelope from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const selectedEnvelope = urlParams.get('selectedEnvelope');
    
    // Redirect back to envelope selection if no envelope was selected
    if (selectedEnvelope === null) {
        window.location.href = 'envelopes.html';
        return;
    }
    
    // Load sound effects
    const sounds = {
        pencil: new Audio('assets/sounds/Pencil.mp3'),
        eraser: new Audio('assets/sounds/Eraser.mp3'),
        typing: new Audio('assets/sounds/Typing.mp3')
    };

    // Configure sounds and preload them
    Object.values(sounds).forEach(sound => {
        sound.load(); // Preload the sound
        sound.volume = 0.3; // Set default volume
    });
    sounds.typing.volume = 0.5; // Typing can be a bit louder
    
    // Function to play sound with optional loop
    function playSound(soundName, shouldLoop = false) {
        const sound = sounds[soundName];
        if (sound) {
            if (sound.paused) { // Only start if not already playing
                sound.loop = shouldLoop;
                // Different start times for different tools
                if (soundName === 'typing') {
                    sound.currentTime = 5.0; // Start typing sound at 5 seconds
                } else if (soundName === 'pencil') {
                    sound.currentTime = 5.0; // Start pencil sound at 5 seconds
                } else {
                    sound.currentTime = 0; // Start eraser from beginning
                }
                sound.play().catch(e => console.log('Sound play prevented:', e));
            }
        }
    }

    // Function to stop sound
    function stopSound(soundName) {
        const sound = sounds[soundName];
        if (sound && !sound.paused) {
            sound.pause();
            // Reset to appropriate position based on tool
            if (soundName === 'typing' || soundName === 'pencil') {
                sound.currentTime = 5.0;
            } else {
                sound.currentTime = 0;
            }
            sound.loop = false;
        }
    }

    // Stop all sounds
    function stopAllSounds() {
        Object.keys(sounds).forEach(soundName => stopSound(soundName));
    }

    // Canvas setup
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const textOverlay = document.querySelector('.text-overlay');
    const toolButtons = document.querySelectorAll('.tool');
    const emojiPicker = document.getElementById('emojiPicker');
    const photoInput = document.getElementById('photoInput');
    
    // Set initial variables
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentTool = 'pencil';
    let currentZIndex = 10;
    let lastTouchEnd = 0; // Track last touch time for preventing double-tap zoom
    
    // Set canvas size
    function resizeCanvas() {
        const container = document.querySelector('.letter-container');
        const headerHeight = document.querySelector('.letter-header').offsetHeight;
        const containerWidth = container.offsetWidth - 16; // 8px margin on both sides
        const containerHeight = container.offsetHeight - headerHeight;
        
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        canvas.style.top = headerHeight + 'px';
    }
    
    // Initialize canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Tool handlers
    const tools = {
        pencil: {
            draw: function(x, y) {
                if (!isDrawing) {
                    playSound('pencil', true);
                }
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(x, y);
                ctx.strokeStyle = '#2563eb';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
                
                // Add texture effect
                const angle = Math.atan2(y - lastY, x - lastX);
                const perpendicular = angle + Math.PI/2;
                
                const dotCount = 8;
                const spread = 2;
                
                for (let i = 0; i < dotCount; i++) {
                    const t = Math.random();
                    const dotX = lastX + (x - lastX) * t;
                    const dotY = lastY + (y - lastY) * t;
                    
                    const offsetDistance = (Math.random() - 0.5) * spread;
                    const offsetX = Math.cos(perpendicular) * offsetDistance;
                    const offsetY = Math.sin(perpendicular) * offsetDistance;
                    
                    ctx.fillStyle = `rgba(37, 99, 235, ${0.1 + Math.random() * 0.2})`;
                    ctx.fillRect(dotX + offsetX, dotY + offsetY, 1, 1);
                }
            }
        },
        eraser: {
            draw: function(x, y) {
                if (!isDrawing) {
                    playSound('eraser', true);
                }
                const eraserSize = 20;
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(x, y, eraserSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        },
        emoji: {
            draw: function(x, y) {
                const emojis = ['😀', '😍', '🥰', '😂', '😎', '🤩', '😊', '👍', '🎉', '💕', '🌈', '🍕'];
                const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                
                ctx.save();
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.globalAlpha = 1.0;  // Ensure full opacity
                
                const rotation = Math.random() * 360;
                ctx.translate(x, y);
                ctx.rotate(rotation * Math.PI / 180);
                
                ctx.fillStyle = 'black';  // Set to solid black for full opacity
                ctx.fillText(emoji, 0, 0);
                ctx.restore();
            }
        },
        text: {
            isTyping: false,
            currentText: '',
            x: 0,
            y: 0,
            cursorVisible: true,
            draw: function(x, y) {
                if (!this.isTyping) {
                    this.isTyping = true;
                    this.x = x;
                    this.y = y;
                    this.currentText = '';
                    this.cursorVisible = true;
                    
                    // Start cursor blink
                    this.blinkCursor();
                    
                    // Start listening for keyboard input
                    document.addEventListener('keydown', this.handleKeyPress);
                }
            },
            handleKeyPress: function(e) {
                if (!tools.text.isTyping) return;
                
                if (e.key === 'Enter') {
                    // Finish typing
                    tools.text.finishTyping();
                } else if (e.key === 'Backspace') {
                    // Remove last character
                    tools.text.currentText = tools.text.currentText.slice(0, -1);
                    tools.text.redrawText();
                } else if (e.key.length === 1) {
                    // Add character
                    tools.text.currentText += e.key;
                    tools.text.redrawText();
                }
            },
            redrawText: function() {
                // Clear the area where text will be
                const metrics = ctx.measureText(this.currentText);
                const height = 24;
                ctx.fillStyle = 'white';
                ctx.fillRect(this.x - 2, this.y - height/2, metrics.width + 4, height);
                
                // Draw the text
                ctx.font = '24px "Cooper BT"';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'black';
                ctx.fillText(this.currentText, this.x, this.y);
                
                // Draw cursor if visible
                if (this.cursorVisible) {
                    this.drawCursor();
                }
            },
            drawCursor: function() {
                const metrics = ctx.measureText(this.currentText);
                const cursorX = this.x + metrics.width;
                
                ctx.beginPath();
                ctx.moveTo(cursorX, this.y - 12);
                ctx.lineTo(cursorX, this.y + 12);
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 1;
                ctx.stroke();
            },
            blinkCursor: function() {
                if (!this.isTyping) return;
                
                this.cursorVisible = !this.cursorVisible;
                this.redrawText();
                
                setTimeout(() => this.blinkCursor(), 500);
            },
            finishTyping: function() {
                this.isTyping = false;
                this.cursorVisible = false;
                document.removeEventListener('keydown', this.handleKeyPress);
                
                // Clear the area one last time and redraw text without cursor
                this.redrawText();
            }
        }
    };
    
    // Drawing event handlers
    function drawStart(e) {
        if (!['pencil', 'eraser', 'emoji', 'text'].includes(currentTool)) return;
        
        const rect = canvas.getBoundingClientRect();
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        const x = e.pageX - (rect.left + scrollX);
        const y = e.pageY - (rect.top + scrollY);
        
        if (currentTool === 'text') {
            // Finish any existing text input
            if (tools.text.isTyping) {
                tools.text.finishTyping();
            }
            tools.text.draw(x, y);
            playSound('typing');
        } else {
            isDrawing = true;
            lastX = x;
            lastY = y;
            
            if (currentTool === 'emoji') {
                tools.emoji.draw(x, y);
            } else if (currentTool === 'pencil') {
                playSound('pencil', true);
            } else if (currentTool === 'eraser') {
                playSound('eraser', true);
            }
        }
    }
    
    function drawEnd() {
        if (isDrawing) {
            isDrawing = false;
            stopAllSounds();
        }
    }
    
    function drawMove(e) {
        if (!isDrawing) return;
        if (currentTool !== 'pencil' && currentTool !== 'eraser' && currentTool !== 'emoji') return;
        
        const rect = canvas.getBoundingClientRect();
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        const x = e.pageX - (rect.left + scrollX);
        const y = e.pageY - (rect.top + scrollY);
        
        // Calculate distance moved
        const dx = x - lastX;
        const dy = y - lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // For emoji tool, only draw new emoji every 30 pixels
        if (currentTool === 'emoji') {
            if (distance > 10) {
                tools.emoji.draw(x, y);
                lastX = x;
                lastY = y;
            }
        } else {
            tools[currentTool].draw(x, y);
            lastX = x;
            lastY = y;
        }
    }
    
    // Add pointer events for drawing
    canvas.addEventListener('pointerdown', drawStart);
    canvas.addEventListener('pointerup', drawEnd);
    canvas.addEventListener('pointerout', drawEnd);
    canvas.addEventListener('pointermove', drawMove);
    
    // Prevent touch scrolling on canvas
    canvas.style.touchAction = 'none';
    
    // Text functionality
    function addTextBox(e) {
        // Create a new text box
        const textBox = document.createElement('div');
        textBox.className = 'text-item';
        textBox.contentEditable = true;
        
        // Set positioning and prevent cursor from changing
        textBox.style.position = 'absolute';
        
        // Give it a higher z-index
        currentZIndex += 1;
        textBox.style.zIndex = currentZIndex.toString();
        
        // Position the text box
        const rect = textOverlay.getBoundingClientRect();
        textBox.style.left = (e.clientX - rect.left) + 'px';
        textBox.style.top = (e.clientY - rect.top) + 'px';
        
        // Add the text box to the overlay
        textOverlay.appendChild(textBox);
        
        // Focus the text box for immediate editing
        setTimeout(() => {
            textBox.focus();
        }, 10);
        
        // Make it draggable but not when editing
        textBox.addEventListener('mousedown', function(e) {
            // If we're focused inside the text box, don't start dragging
            if (document.activeElement === this) {
                e.stopPropagation();
            } else {
                // Bring to front
                currentZIndex += 1;
                this.style.zIndex = currentZIndex.toString();
            }
        });
        
        // Make it draggable, but not when editing
        makeElementDraggable(textBox, true);
    }
    
    // Tool selection
    toolButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tool = this.dataset.tool;
            const previousTool = currentTool;
            
            // Stop all sounds when switching tools
            stopAllSounds();

            // Remove selected class from all tools
            toolButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Add selected class to clicked tool
            this.classList.add('selected');
            
            // Set current tool
            currentTool = tool;
            
            // If switching away from text tool, finish any active typing
            if (previousTool === 'text' && tools.text.isTyping) {
                tools.text.finishTyping();
            }
            
            // If switching away from photo tool, fix all photos in place
            if (previousTool === 'photo') {
                document.querySelectorAll('.photo-preview').forEach(photo => {
                    photo.classList.remove('active');
                });
            }
            
            // If switching to photo tool, make all photos draggable again
            if (tool === 'photo') {
                document.querySelectorAll('.photo-preview').forEach(photo => {
                    photo.classList.add('active');
                });
                photoInput.click();
            }
            
            // Hide emoji picker when switching tools
            emojiPicker.classList.remove('active');
        });
    });
    
    // Emoji picker toggle
    function toggleEmojiPicker() {
        emojiPicker.classList.toggle('active');
    }
    
    // Set up emoji selection
    document.querySelectorAll('.emoji-item').forEach(emojiItem => {
        emojiItem.addEventListener('click', function() {
            const emoji = this.innerText;
            
            // Draw emoji at center of canvas
            const x = canvas.width / 2;
            const y = canvas.height / 2;
            
            ctx.save();
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, x, y);
            ctx.restore();
            
            emojiPicker.classList.remove('active');
        });
    });
    
    // Photo functionality
    photoInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                addPhotoToCanvas(e.target.result);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    function addPhotoToCanvas(imageSrc) {
        // Create photo container
        const photoContainer = document.createElement('div');
        photoContainer.className = 'photo-preview active';
        
        // Bring to front
        currentZIndex += 1;
        photoContainer.style.zIndex = currentZIndex.toString();
        
        // Position in the center
        const photoWidth = 200;
        const photoHeight = 240;
        photoContainer.style.left = (canvas.width / 2 - photoWidth / 2) + 'px';
        photoContainer.style.top = (canvas.height / 2 - photoHeight / 2) + 'px';
        
        // Create image element
        const img = document.createElement('img');
        img.src = imageSrc;
        photoContainer.appendChild(img);
        
        // Add delete button
        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerText = '×';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            photoContainer.remove();
        });
        
        photoContainer.appendChild(deleteBtn);
        textOverlay.appendChild(photoContainer);
        
        // Make photo draggable
        makeElementDraggable(photoContainer);
    }
    
    // Make elements draggable
    function makeElementDraggable(element, isTextBox = false) {
        let startX, startY;
        let startLeft, startTop;
        let isDragging = false;
        
        element.addEventListener('mousedown', function(e) {
            // Don't start dragging if clicking delete button
            if (e.target.className === 'delete-btn') {
                return;
            }

            // For photos, only allow dragging when active
            if (!isTextBox && !element.classList.contains('active')) {
                return;
            }
            
            // For text boxes, don't start dragging if editing
            if (isTextBox && document.activeElement === element) {
                // Only allow dragging from edge of text box
                const rect = element.getBoundingClientRect();
                const isNearEdge = 
                    e.clientX - rect.left < 10 || 
                    rect.right - e.clientX < 10 || 
                    e.clientY - rect.top < 10 || 
                    rect.bottom - e.clientY < 10;
                    
                if (!isNearEdge) {
                    return; // Allow editing when clicking in center
                }
            }
            
            // Bring to front
            currentZIndex += 1;
            element.style.zIndex = currentZIndex.toString();
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(element.style.left) || 0;
            startTop = parseInt(element.style.top) || 0;
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            // Prevent default to avoid text selection during drag
            e.preventDefault();
        });
        
        // Split touch handling into two phases - initial touch without prevent default
        // This lets us use passive: true for better performance
        element.addEventListener('touchstart', function(e) {
            // Don't start dragging if clicking delete button
            if (e.target.className === 'delete-btn') {
                return;
            }
            
            // Bring to front
            currentZIndex += 1;
            element.style.zIndex = currentZIndex.toString();
            
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startLeft = parseInt(element.style.left) || 0;
            startTop = parseInt(element.style.top) || 0;
            
            // We'll only start actual dragging on the first move
            document.addEventListener('touchmove', handleFirstMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
            
        }, { passive: true }); // Mark as passive since we don't preventDefault here
        
        // Handle the first move event separately
        function handleFirstMove(e) {
            isDragging = true;
            e.preventDefault(); // Prevent scrolling on the first move
            
            // Calculate the new position
            const touch = e.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            
            element.style.left = (startLeft + dx) + 'px';
            element.style.top = (startTop + dy) + 'px';
            
            // Remove first move handler and add regular move handler
            document.removeEventListener('touchmove', handleFirstMove);
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
        }
        
        function handleMouseMove(e) {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            element.style.left = (startLeft + dx) + 'px';
            element.style.top = (startTop + dy) + 'px';
        }
        
        function handleTouchMove(e) {
            if (!isDragging) return;
            
            // Calculate the new position
            const touch = e.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            
            element.style.left = (startLeft + dx) + 'px';
            element.style.top = (startTop + dy) + 'px';
            
            // Prevent scrolling
            e.preventDefault();
        }
        
        function handleMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
        
        function handleTouchEnd() {
            isDragging = false;
            document.removeEventListener('touchmove', handleFirstMove);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        }
    }
    
    // Set up send button
    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
        sendButton.addEventListener('click', function() {
            alert('Letter sent!');
        });
    }

    // Set up share button
    const shareButton = document.getElementById('shareButton');
    if (shareButton) {
        shareButton.addEventListener('click', async function() {
            try {
                // Convert canvas to blob
                const canvasBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                
                // Create file from blob
                const file = new File([canvasBlob], 'my-letter.png', { type: 'image/png' });

                // Check if Web Share API is available and supports files
                if (navigator.share && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'My Letter',
                        text: 'Check out my letter!'
                    });
                } else {
                    // Fallback: Download the image
                    const link = document.createElement('a');
                    link.download = 'my-letter.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                }
            } catch (error) {
                console.error('Error sharing:', error);
                alert('Could not share the letter. Downloading instead...');
                // Fallback to download
                const link = document.createElement('a');
                link.download = 'my-letter.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        });
    }

    // Prevent double tap zoom on mobile
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
});