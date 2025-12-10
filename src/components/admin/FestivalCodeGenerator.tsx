import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Code, 
  Wand2, 
  Copy, 
  Download, 
  Eye, 
  Palette, 
  Zap, 
  Layers,
  Save,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';

interface FestivalCodeGeneratorProps {
  festivalName: string;
  festivalColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  onCodeGenerated: (code: { html: string; css: string; js: string }) => void;
}

const FestivalCodeGenerator: React.FC<FestivalCodeGeneratorProps> = ({
  festivalName,
  festivalColors,
  onCodeGenerated
}) => {
  const [selectedEffect, setSelectedEffect] = useState('sparkles');
  const [customizations, setCustomizations] = useState({
    particleCount: 50,
    animationSpeed: 2,
    size: 20,
    opacity: 0.8,
    zIndex: 20
  });
  const [generatedCode, setGeneratedCode] = useState<{ html: string; css: string; js: string } | null>(null);

  const effectTemplates = {
    sparkles: {
      name: 'Floating Sparkles',
      description: 'Animated sparkles that float across the screen',
      html: `<div id="sparkle-overlay" class="sparkle-overlay"></div>`,
      css: `
.sparkle-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: {{zIndex}};
  overflow: hidden;
}

.sparkle {
  position: absolute;
  font-size: {{size}}px;
  color: {{color}};
  animation: sparkleFloat {{speed}}s ease-in-out infinite;
  filter: drop-shadow(0 0 6px {{color}});
  opacity: {{opacity}};
}

@keyframes sparkleFloat {
  0% { 
    transform: translateY(100vh) translateX(0) rotate(0deg) scale(0); 
    opacity: 0; 
  }
  10% { 
    opacity: {{opacity}}; 
    transform: scale(1); 
  }
  90% { 
    opacity: {{opacity}}; 
  }
  100% { 
    transform: translateY(-20px) translateX(100px) rotate(360deg) scale(0); 
    opacity: 0; 
  }
}`,
      js: `
function initSparkleEffect() {
  const container = document.getElementById('sparkle-overlay');
  if (!container) return;
  
  const sparkleEmojis = ['✨', '⭐', '🌟', '💫', '⚡'];
  
  function createSparkle() {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.innerHTML = sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)];
    sparkle.style.left = Math.random() * 100 + '%';
    sparkle.style.animationDelay = Math.random() * 2 + 's';
    sparkle.style.animationDuration = ({{speed}} + Math.random() * 2) + 's';
    
    container.appendChild(sparkle);
    
    setTimeout(() => {
      if (sparkle.parentNode) {
        sparkle.parentNode.removeChild(sparkle);
      }
    }, ({{speed}} + 2) * 1000);
  }
  
  // Create initial sparkles
  for (let i = 0; i < {{count}}; i++) {
    setTimeout(createSparkle, i * 100);
  }
  
  // Continue creating sparkles
  setInterval(createSparkle, 500);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSparkleEffect);
} else {
  initSparkleEffect();
}`
    },
    confetti: {
      name: 'Confetti Rain',
      description: 'Colorful confetti falling from the top',
      html: `<div id="confetti-overlay" class="confetti-overlay"></div>`,
      css: `
.confetti-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: {{zIndex}};
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  width: {{size}}px;
  height: {{size}}px;
  background: {{color}};
  animation: confettiFall {{speed}}s linear infinite;
  opacity: {{opacity}};
}

@keyframes confettiFall {
  0% { 
    transform: translateY(-20px) rotate(0deg); 
    opacity: {{opacity}}; 
  }
  100% { 
    transform: translateY(100vh) rotate(360deg); 
    opacity: 0; 
  }
}`,
      js: `
function initConfettiEffect() {
  const container = document.getElementById('confetti-overlay');
  if (!container) return;
  
  const colors = ['{{primary}}', '{{secondary}}', '{{accent}}', '#FF6B6B', '#4ECDC4', '#45B7D1'];
  
  function createConfetti() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 2 + 's';
    confetti.style.animationDuration = ({{speed}} + Math.random()) + 's';
    
    container.appendChild(confetti);
    
    setTimeout(() => {
      if (confetti.parentNode) {
        confetti.parentNode.removeChild(confetti);
      }
    }, {{speed}} * 1000);
  }
  
  // Create confetti continuously
  setInterval(createConfetti, 100);
}

initConfettiEffect();`
    },
    fireworks: {
      name: 'Fireworks Burst',
      description: 'Explosive firework animations',
      html: `<canvas id="fireworks-canvas" class="fireworks-overlay"></canvas>`,
      css: `
.fireworks-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: {{zIndex}};
}`,
      js: `
class FireworksEffect {
  constructor() {
    this.canvas = document.getElementById('fireworks-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.fireworks = [];
    this.particles = [];
    this.colors = ['{{primary}}', '{{secondary}}', '{{accent}}'];
    
    this.resize();
    this.animate();
    
    window.addEventListener('resize', () => this.resize());
    setInterval(() => this.createFirework(), 1000);
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  createFirework() {
    this.fireworks.push({
      x: Math.random() * this.canvas.width,
      y: this.canvas.height,
      targetY: Math.random() * this.canvas.height * 0.5,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      speed: {{speed}} + Math.random() * 2
    });
  }
  
  animate() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update fireworks
    this.fireworks = this.fireworks.filter(firework => {
      firework.y -= firework.speed;
      
      this.ctx.fillStyle = firework.color;
      this.ctx.beginPath();
      this.ctx.arc(firework.x, firework.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
      
      if (firework.y <= firework.targetY) {
        this.explode(firework.x, firework.y, firework.color);
        return false;
      }
      return true;
    });
    
    // Update particles
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // gravity
      particle.alpha -= 0.01;
      
      this.ctx.save();
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
      
      return particle.alpha > 0;
    });
    
    requestAnimationFrame(() => this.animate());
  }
  
  explode(x, y, color) {
    for (let i = 0; i < {{count}}; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color: color,
        alpha: 1,
        size: Math.random() * 3 + 1
      });
    }
  }
}

new FireworksEffect();`
    }
  };

  const generateCode = () => {
    const effect = effectTemplates[selectedEffect];
    if (!effect) return;

    let html = effect.html;
    let css = effect.css;
    let js = effect.js;

    // Replace placeholders with actual values
    const replacements = {
      '{{color}}': festivalColors.accent,
      '{{primary}}': festivalColors.primary,
      '{{secondary}}': festivalColors.secondary,
      '{{accent}}': festivalColors.accent,
      '{{size}}': customizations.size,
      '{{speed}}': customizations.animationSpeed,
      '{{count}}': customizations.particleCount,
      '{{opacity}}': customizations.opacity,
      '{{zIndex}}': customizations.zIndex
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      html = html.replace(regex, String(value));
      css = css.replace(regex, String(value));
      js = js.replace(regex, String(value));
    });

    const code = { html, css, js };
    setGeneratedCode(code);
    onCodeGenerated(code);
  };

  const copyCode = async (codeType: 'html' | 'css' | 'js') => {
    if (!generatedCode) return;
    
    try {
      await navigator.clipboard.writeText(generatedCode[codeType]);
      toast.success(`${codeType.toUpperCase()} code copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const downloadCode = () => {
    if (!generatedCode) return;

    const content = `<!-- ${festivalName} Festival Effect -->
<!-- Generated by SamanKhojo Festival Code Generator -->

<!-- HTML -->
${generatedCode.html}

<!-- CSS -->
<style>
${generatedCode.css}
</style>

<!-- JavaScript -->
<script>
${generatedCode.js}
</script>`;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${festivalName}-${selectedEffect}-effect.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-white/30 shadow-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Wand2 className="text-purple-600" size={28} />
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Festival Code Generator</h3>
          <p className="text-gray-600">Generate custom effects and banners with code</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Effect Selection */}
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4">Select Effect Type</h4>
            <div className="space-y-3">
              {Object.entries(effectTemplates).map(([key, effect]) => (
                <button
                  key={key}
                  onClick={() => setSelectedEffect(key)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedEffect === key
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedEffect === key ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {key === 'sparkles' && <Zap size={20} />}
                      {key === 'confetti' && <Layers size={20} />}
                      {key === 'fireworks' && <Eye size={20} />}
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900">{effect.name}</h5>
                      <p className="text-sm text-gray-600">{effect.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Customization Controls */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4">Customization</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Particle Count: {customizations.particleCount}
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={customizations.particleCount}
                  onChange={(e) => setCustomizations(prev => ({ 
                    ...prev, 
                    particleCount: parseInt(e.target.value) 
                  }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Animation Speed: {customizations.animationSpeed}s
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={customizations.animationSpeed}
                  onChange={(e) => setCustomizations(prev => ({ 
                    ...prev, 
                    animationSpeed: parseFloat(e.target.value) 
                  }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size: {customizations.size}px
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={customizations.size}
                  onChange={(e) => setCustomizations(prev => ({ 
                    ...prev, 
                    size: parseInt(e.target.value) 
                  }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opacity: {Math.round(customizations.opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={customizations.opacity}
                  onChange={(e) => setCustomizations(prev => ({ 
                    ...prev, 
                    opacity: parseFloat(e.target.value) 
                  }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateCode}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-bold shadow-lg"
          >
            <Wand2 size={20} />
            <span>Generate Code</span>
          </button>
        </div>

        {/* Generated Code Display */}
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4">Generated Code</h4>
            
            {generatedCode ? (
              <div className="space-y-4">
                {/* HTML Code */}
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-gray-100 border-b border-gray-200">
                    <span className="font-medium text-gray-900">HTML</span>
                    <button
                      onClick={() => copyCode('html')}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <Copy size={14} />
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="p-4 text-sm overflow-x-auto">
                    <code>{generatedCode.html}</code>
                  </pre>
                </div>

                {/* CSS Code */}
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-gray-100 border-b border-gray-200">
                    <span className="font-medium text-gray-900">CSS</span>
                    <button
                      onClick={() => copyCode('css')}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <Copy size={14} />
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="p-4 text-sm overflow-x-auto max-h-32">
                    <code>{generatedCode.css}</code>
                  </pre>
                </div>

                {/* JavaScript Code */}
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-gray-100 border-b border-gray-200">
                    <span className="font-medium text-gray-900">JavaScript</span>
                    <button
                      onClick={() => copyCode('js')}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <Copy size={14} />
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="p-4 text-sm overflow-x-auto max-h-32">
                    <code>{generatedCode.js}</code>
                  </pre>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={downloadCode}
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-colors"
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      // Add to festival assets
                      toast.success('Effect added to festival!');
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Save size={16} />
                    <span>Add to Festival</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Code className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Code Generated</h3>
                <p className="text-gray-600">
                  Select an effect type and click "Generate Code" to see the custom code
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Color Preview */}
      <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
        <h5 className="font-semibold text-gray-900 mb-3">Festival Color Palette</h5>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <div 
              className="w-8 h-8 rounded-lg border border-gray-300"
              style={{ backgroundColor: festivalColors.primary }}
            ></div>
            <span className="text-sm text-gray-700">Primary</span>
          </div>
          <div className="flex items-center space-x-2">
            <div 
              className="w-8 h-8 rounded-lg border border-gray-300"
              style={{ backgroundColor: festivalColors.secondary }}
            ></div>
            <span className="text-sm text-gray-700">Secondary</span>
          </div>
          <div className="flex items-center space-x-2">
            <div 
              className="w-8 h-8 rounded-lg border border-gray-300"
              style={{ backgroundColor: festivalColors.accent }}
            ></div>
            <span className="text-sm text-gray-700">Accent</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FestivalCodeGenerator;