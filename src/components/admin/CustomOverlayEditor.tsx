import React, { useState, useRef } from 'react';
import { Festival } from '../../types/Festival';
import { Code, Eye, Save, AlertTriangle, RefreshCw, Copy, Download, Upload } from 'lucide-react';
import './CustomOverlayEditor.css';

interface CustomOverlayEditorProps {
  festival: Festival;
  onSave: (customOverlayCode: string) => void;
  onPreview?: (code: string) => void;
}

export const CustomOverlayEditor: React.FC<CustomOverlayEditorProps> = ({
  festival,
  onSave,
  onPreview
}) => {
  const [code, setCode] = useState(festival.style.assets.customOverlayCode || '');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(code);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    setIsPreviewMode(!isPreviewMode);
    if (onPreview) {
      onPreview(isPreviewMode ? '' : code);
    }
  };

  const handleCopyTemplate = (template: string) => {
    setCode(template);
  };

  const handleExportCode = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${festival.name}-overlay.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportCode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
      };
      reader.readAsText(file);
    }
  };

  const templates = {
    'Animated Welcome': `<div class="welcome-overlay">
  <div class="welcome-content">
    <h1 class="welcome-title">🎉 Welcome to ${festival.displayName}! 🎉</h1>
    <p class="welcome-subtitle">Join us for an amazing celebration!</p>
  </div>
</div>

<style>
.welcome-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 1s ease-in;
}

.welcome-content {
  text-align: center;
  color: white;
  padding: 40px;
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  animation: slideInUp 0.8s ease-out 0.2s both;
}

.welcome-title {
  font-size: 3rem;
  margin: 0 0 20px 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  animation: bounce 2s infinite;
}

.welcome-subtitle {
  font-size: 1.5rem;
  margin: 0;
  opacity: 0.9;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}
</style>

<script>
// Auto-hide after 5 seconds
setTimeout(() => {
  const overlay = document.querySelector('.welcome-overlay');
  if (overlay) {
    overlay.style.animation = 'fadeOut 0.5s ease-out forwards';
    setTimeout(() => overlay.remove(), 500);
  }
}, 5000);
</script>`,

    'Floating Particles': `<div class="particle-system">
  <canvas id="particleCanvas"></canvas>
</div>

<style>
.particle-system {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

#particleCanvas {
  width: 100%;
  height: 100%;
}
</style>

<script>
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const particles = [];
const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.size = Math.random() * 4 + 1;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.opacity = Math.random() * 0.5 + 0.3;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

for (let i = 0; i < 50; i++) {
  particles.push(new Particle());
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  particles.forEach(particle => {
    particle.update();
    particle.draw();
  });
  
  requestAnimationFrame(animate);
}

animate();
</script>`,

    'Corner Notification': `<div class="corner-notification">
  <div class="notification-content">
    <div class="notification-icon">🎊</div>
    <div class="notification-text">
      <h4>${festival.displayName} is Live!</h4>
      <p>Don't miss out on the celebration</p>
    </div>
    <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
  </div>
</div>

<style>
.corner-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  animation: slideInRight 0.5s ease-out;
}

.notification-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 320px;
  border-left: 4px solid #4ecdc4;
}

.notification-icon {
  font-size: 2rem;
  animation: pulse 2s infinite;
}

.notification-text h4 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 1rem;
}

.notification-text p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.notification-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.notification-close:hover {
  background: #f0f0f0;
  color: #333;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>`
  };

  return (
    <div className="custom-overlay-editor">
      <div className="editor-header">
        <h3 className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          Custom Overlay Code Editor
        </h3>
        <div className="editor-actions">
          <button
            onClick={handlePreview}
            className={`btn ${isPreviewMode ? 'btn-secondary' : 'btn-outline'}`}
          >
            <Eye className="w-4 h-4" />
            {isPreviewMode ? 'Stop Preview' : 'Preview'}
          </button>
          <button
            onClick={handleExportCode}
            className="btn btn-outline"
            disabled={!code.trim()}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-outline"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm,.txt"
        onChange={handleImportCode}
        style={{ display: 'none' }}
      />

      <div className="editor-templates">
        <h4>Quick Templates:</h4>
        <div className="template-buttons">
          {Object.entries(templates).map(([name, template]) => (
            <button
              key={name}
              onClick={() => handleCopyTemplate(template)}
              className="btn btn-sm btn-outline"
            >
              <Copy className="w-3 h-3" />
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="editor-warning">
        <AlertTriangle className="w-4 h-4" />
        <span>Custom overlay code will be applied to the entire website when the festival is active. Test thoroughly before saving.</span>
      </div>

      <div className="code-editor">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter your custom HTML, CSS, and JavaScript code here..."
          className="code-textarea"
          spellCheck={false}
        />
      </div>

      <div className="editor-help">
        <h4>Guidelines:</h4>
        <ul>
          <li>Use <code>&lt;style&gt;</code> tags for CSS</li>
          <li>Use <code>&lt;script&gt;</code> tags for JavaScript</li>
          <li>Overlay will be positioned fixed with high z-index</li>
          <li>Use <code>pointer-events: none</code> for non-interactive overlays</li>
          <li>Test responsiveness across different screen sizes</li>
          <li>Avoid blocking important UI elements</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomOverlayEditor;