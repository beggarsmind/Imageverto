class ImageConverter {
  constructor() {
    this.currentFile = null;
    this.supportedFormats = [
      'jpeg',
      'png',
      'webp',
      'gif',
      'bmp',
      'ico',
      'tiff',
      'svg',
    ];
    this.unsupportedFormats = [
      'raw',
      'cr2',
      'nef',
      'arw',
      'dng',
      'psd',
      'ai',
      'eps',
      'heic',
      'exr',
      'apng',
      'jp2',
    ];
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const formatSelect = document.getElementById('formatSelect');
    const convertBtn = document.getElementById('convertBtn');
    const qualitySlider = document.getElementById('qualitySlider');
    const darkModeToggle = document.getElementById('darkModeToggle');

    // File input change
    fileInput.addEventListener('change', (e) => {
      this.clearError();
      this.handleFileSelect(e.target.files[0]);
    });

    // Keyboard support for file upload
    fileInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        fileInput.click();
      }
    });

    // Drag and drop (desktop)
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this.clearError();
        this.handleFileSelect(file);
      } else {
        this.showError('Please drop a valid image file.');
      }
    });

    // Touch events for drag-and-drop (mobile)
    uploadArea.addEventListener('touchstart', (e) => {
      uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('touchend', (e) => {
      uploadArea.classList.remove('drag-over');
    });

    // Format selection
    formatSelect.addEventListener('change', () => this.handleFormatChange());

    // Convert button
    convertBtn.addEventListener('click', () => this.convertImage());

    // Quality slider (debounced)
    let qualityTimeout;
    qualitySlider.addEventListener('input', (e) => {
      clearTimeout(qualityTimeout);
      qualityTimeout = setTimeout(() => {
        document.getElementById('qualityValue').textContent = e.target.value;
      }, 100);
    });

    // Dark mode toggle
    if (darkModeToggle) {
      darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
      });
    }
  }

  handleFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
      this.showError('Please select a valid image file.');
      return;
    }
    // File size validation (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.showError('File is too large. Maximum size is 10MB.');
      return;
    }
    this.currentFile = file;
    this.showImagePreview(file);
    this.showElement('formatSection');
    this.hideElement('errorSection');
  }

  showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewImg = document.getElementById('previewImg');
      const fileName = document.getElementById('fileName');
      const fileInfo = document.getElementById('fileInfo');

      previewImg.src = e.target.result;
      fileName.textContent = file.name;
      fileInfo.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB • ${
        file.type
      }`;

      this.showElement('imagePreview');
    };
    reader.readAsDataURL(file);
  }

  handleFormatChange() {
    const format = document.getElementById('formatSelect').value;

    if (!format) {
      this.hideElement('convertBtn');
      this.hideElement('qualitySection');
      return;
    }

    if (this.unsupportedFormats.includes(format)) {
      this.showError(
        'Conversion for this format is not supported in-browser. Use a desktop app instead.'
      );
      this.hideElement('convertBtn');
      this.hideElement('qualitySection');
      return;
    }

    this.hideElement('errorSection');

    // Show quality settings for lossy formats
    if (['jpeg', 'webp'].includes(format)) {
      this.showElement('qualitySection');
    } else {
      this.hideElement('qualitySection');
    }

    this.showElement('convertBtn');
  }

  async convertImage() {
    const format = document.getElementById('formatSelect').value;
    const quality = document.getElementById('qualitySlider').value / 100;

    if (!this.currentFile || !format) return;

    try {
      this.showProgress();
      this.updateProgress(20, 'Loading image...');

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        this.updateProgress(50, 'Processing image...');

        // Handle different background colors for different formats
        if (format === 'jpeg') {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        this.updateProgress(80, 'Converting format...');

        // Convert to target format
        let mimeType = `image/${format}`;
        if (format === 'jpeg') mimeType = 'image/jpeg';

        const convertedDataUrl = canvas.toDataURL(mimeType, quality);

        this.updateProgress(100, 'Complete!');

        setTimeout(() => {
          this.showDownload(convertedDataUrl, format);
        }, 500);
      };

      img.onerror = () => {
        this.showError('Failed to load image. Please try a different file.');
        this.hideProgress();
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.readAsDataURL(this.currentFile);
    } catch (error) {
      this.showError('Conversion failed. Please try again.');
      this.hideProgress();
    }
  }

  showDownload(dataUrl, format) {
    const downloadLink = document.getElementById('downloadLink');
    const downloadInfo = document.getElementById('downloadInfo');

    // Sanitize file name
    const originalName = this.currentFile.name
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .split('.')[0];
    const fileName = `${originalName}_converted.${format}`;

    downloadLink.href = dataUrl;
    downloadLink.download = fileName;
    downloadInfo.textContent = `File: ${fileName}`;

    this.hideProgress();
    this.showElement('downloadSection');
  }

  showProgress() {
    this.showElement('progressSection');
    document.getElementById('convertBtn').disabled = true;
    document.getElementById('convertBtn').classList.add('processing');
  }

  hideProgress() {
    this.hideElement('progressSection');
    document.getElementById('convertBtn').disabled = false;
    document.getElementById('convertBtn').classList.remove('processing');
  }

  updateProgress(percent, text) {
    document.getElementById('progressBar').style.width = `${percent}%`;
    document.getElementById('progressText').textContent = text;
  }

  showError(message) {
    document.getElementById('errorMessage').textContent = message;
    this.showElement('errorSection');
    document.getElementById('errorMessage').focus();
  }

  clearError() {
    document.getElementById('errorMessage').textContent = '';
    this.hideElement('errorSection');
  }

  showElement(id) {
    document.getElementById(id).classList.remove('hidden');
  }

  hideElement(id) {
    document.getElementById(id).classList.add('hidden');
  }
}

// Mobile menu functionality
function initializeMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuIcon = document.getElementById('menuIcon');
  const closeIcon = document.getElementById('closeIcon');

  mobileMenuBtn.addEventListener('click', () => {
    const isHidden = mobileMenu.classList.contains('hidden');

    if (isHidden) {
      mobileMenu.classList.remove('hidden');
      menuIcon.classList.add('hidden');
      closeIcon.classList.remove('hidden');
    } else {
      mobileMenu.classList.add('hidden');
      menuIcon.classList.remove('hidden');
      closeIcon.classList.add('hidden');
    }
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.add('hidden');
      menuIcon.classList.remove('hidden');
      closeIcon.classList.add('hidden');
    }
  });

  // Close mobile menu when window is resized to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      mobileMenu.classList.add('hidden');
      menuIcon.classList.remove('hidden');
      closeIcon.classList.add('hidden');
    }
  });
}

// Initialize the converter and mobile menu when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new ImageConverter();
  initializeMobileMenu();
  // Remove unused Cloudflare script if present
  const cfScript = document.querySelector(
    'script[src*="cdn-cgi/challenge-platform/scripts/jsd/main.js"]'
  );
  if (cfScript) cfScript.remove();
});
