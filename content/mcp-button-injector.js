/**
 * Nyx Control Hub - MCP Button Injector
 * Automatically finds chat input boxes on AI chat sites and injects the MCP button
 */

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.NyxMCPButtonInjected) {
    console.debug('[Nyx MCP] Already injected, skipping');
    return;
  }
  window.NyxMCPButtonInjected = true;

  console.debug('[Nyx MCP] Button injector initialized for hostname:', window.location.hostname);
  
  // ULTRA-CONSERVATIVE approach for React sites (Claude.ai)
  if (window.location.hostname.includes('claude.ai')) {
    console.debug('[Nyx MCP] React site detected - using ultra-conservative injection');
    
    // Function to safely inject only if page is completely stable
    const safeInject = () => {
      // Check if React has been running for a while
      const reactRoot = document.getElementById('__next');
      if (!reactRoot) return false;
      
      // Check if any loading indicators are gone
      const loadingElements = document.querySelectorAll('[class*="loading"], [class*="skeleton"]');
      if (loadingElements.length > 0) return false;
      
      // Check if chat input exists and is interactive
      const chatInput = document.querySelector('[contenteditable="true"], textarea');
      if (!chatInput || chatInput.getAttribute('aria-disabled') === 'true') return false;
      
      // All checks passed - inject if not already present
      if (!document.getElementById('nyx-mcp-button')) {
        console.debug('[Nyx MCP] Page stable, injecting button');
        injectMCPButton();
      }
      return true;
    };
    
    // Don't even try until after load + significant delay
    let injectionAttempts = 0;
    const maxAttempts = 3;
    
    const attemptSafeInjection = () => {
      if (safeInject() || injectionAttempts >= maxAttempts) {
        return;
      }
      injectionAttempts++;
      // Increasing delays: 5s, 8s, 12s
      setTimeout(attemptSafeInjection, 5000 + (injectionAttempts * 3000));
    };
    
    // Start the process after page load
    if (document.readyState === 'complete') {
      setTimeout(attemptSafeInjection, 5000);
    } else {
      window.addEventListener('load', () => {
        setTimeout(attemptSafeInjection, 5000);
      });
    }
    
    // Also try when user interacts (safer time to modify)
    document.addEventListener('click', () => {
      setTimeout(() => {
        if (!document.getElementById('nyx-mcp-button') && injectionAttempts < maxAttempts) {
          console.debug('[Nyx MCP] User interaction - trying injection');
          safeInject();
        }
      }, 1000);
    }, { once: true });
  }

  // Site configurations for chat input detection
  const siteConfigs = {
    'chat.deepseek.com': {
      inputSelectors: [
        'textarea[placeholder*="Message DeepSeek"]',
        'textarea[spellcheck="false"]',
        '.chat-input textarea',
        '[data-testid="chat-input"]'
      ],
      buttonContainerSelectors: [
        '.chat-input-container .actions',
        '.input-area .toolbar',
        '.chat-input-wrapper .buttons',
        '[data-testid="chat-input"] ~ div'
      ],
      buttonStyle: 'deepseek'
    },
    'chat.openai.com': {
      inputSelectors: [
        'textarea[placeholder*="Message ChatGPT"]',
        'textarea[data-testid="chat-input"]',
        '#prompt-textarea'
      ],
      buttonContainerSelectors: [
        '.absolute.bottom-0 .flex',
        '.chat-input-container .flex',
        '[data-testid="chat-input"] ~ div'
      ],
      buttonStyle: 'openai'
    },
    'chatgpt.com': {
      inputSelectors: [
        'textarea[placeholder*="Message ChatGPT"]',
        'textarea[data-testid="chat-input"]',
        '#prompt-textarea'
      ],
      buttonContainerSelectors: [
        '.absolute.bottom-0 .flex',
        '.chat-input-container .flex'
      ],
      buttonStyle: 'openai'
    },
    'claude.ai': {
      inputSelectors: [
        'textarea[placeholder*="Message Claude"]',
        '.claude-input textarea',
        '[data-testid="chat-input"]'
      ],
      buttonContainerSelectors: [
        '.claude-input-container .actions',
        '.input-wrapper .flex'
      ],
      buttonStyle: 'claude'
    },
    'gemini.google.com': {
      inputSelectors: [
        'textarea[placeholder*="Ask Gemini"]',
        '.chat-input textarea',
        'rich-textarea'
      ],
      buttonContainerSelectors: [
        '.input-area .actions',
        '.chat-input-container .toolbar'
      ],
      buttonStyle: 'gemini'
    },
    'aistudio.google.com': {
      inputSelectors: [
        'textarea[placeholder*="Type something"]',
        '.prompt-input textarea',
        'input-area textarea'
      ],
      buttonContainerSelectors: [
        '.prompt-input-wrapper .actions',
        '.input-area .flex'
      ],
      buttonStyle: 'aistudio'
    },
    'github.com': {
      inputSelectors: [
        'textarea[placeholder*="Ask Copilot"]',
        '.copilot-chat-input textarea',
        '[data-testid="chat-input"]'
      ],
      buttonContainerSelectors: [
        '.copilot-chat-input-container .actions',
        '.ChatInput-module__toolbar--ZtCiG'
      ],
      buttonStyle: 'github'
    },
    'grok.x.ai': {
      inputSelectors: [
        'textarea[placeholder*="Ask Grok"]',
        '.chat-input textarea',
        '[data-testid="chat-input"]'
      ],
      buttonContainerSelectors: [
        '.chat-input-container .actions',
        '.input-area .flex'
      ],
      buttonStyle: 'grok'
    },
    'perplexity.ai': {
      inputSelectors: [
        'textarea[placeholder*="Ask anything"]',
        '.search-input textarea',
        '[data-testid="search-input"]'
      ],
      buttonContainerSelectors: [
        '.search-input-container .actions',
        '.input-area .flex'
      ],
      buttonStyle: 'perplexity'
    },
    'openrouter.ai': {
      inputSelectors: [
        'textarea[placeholder*="Message"]',
        '.chat-input textarea'
      ],
      buttonContainerSelectors: [
        '.chat-input-container .actions'
      ],
      buttonStyle: 'default'
    },
    't3.chat': {
      inputSelectors: [
        'textarea[placeholder*="Message"]',
        '.chat-input textarea'
      ],
      buttonContainerSelectors: [
        '.chat-input-container .actions'
      ],
      buttonStyle: 'default'
    },
    'chat.mistral.ai': {
      inputSelectors: [
        'textarea[placeholder*="Message"]',
        '.chat-input textarea'
      ],
      buttonContainerSelectors: [
        '.chat-input-container .actions'
      ],
      buttonStyle: 'default'
    }
  };

  // Get current site config
  function getSiteConfig() {
    const hostname = window.location.hostname;
    for (const [site, config] of Object.entries(siteConfigs)) {
      if (hostname.includes(site)) {
        return { site, ...config };
      }
    }
    // Default fallback
    return {
      site: 'default',
      inputSelectors: [
        'textarea[placeholder*="message" i]',
        'textarea[placeholder*="chat" i]',
        'textarea[placeholder*="ask" i]',
        '.chat-input textarea',
        '[data-testid="chat-input"]',
        'textarea[rows]'
      ],
      buttonContainerSelectors: [
        '.chat-input-container .actions',
        '.input-area .flex',
        'textarea ~ div',
        '.chat-input-wrapper > div:last-child'
      ],
      buttonStyle: 'default'
    };
  }

  // Find chat input element
  function findChatInput(config) {
    for (const selector of config.inputSelectors) {
      const input = document.querySelector(selector);
      if (input) {
        console.debug('[Nyx MCP] Found chat input:', selector);
        return input;
      }
    }
    // Fallback: find any visible textarea
    const textareas = document.querySelectorAll('textarea');
    for (const textarea of textareas) {
      const rect = textarea.getBoundingClientRect();
      if (rect.width > 200 && rect.height > 40) {
        console.debug('[Nyx MCP] Found chat input (fallback)');
        return textarea;
      }
    }
    return null;
  }

  // Find button container
  function findButtonContainer(config, inputElement) {
    // Try config selectors first
    for (const selector of config.buttonContainerSelectors) {
      const container = document.querySelector(selector);
      if (container) {
        console.debug('[Nyx MCP] Found button container:', selector);
        return container;
      }
    }
    
    // Fallback: look for sibling container
    if (inputElement) {
      const parent = inputElement.parentElement;
      if (parent) {
        // Look for a flex container with buttons
        const sibling = parent.querySelector('.flex, .actions, .toolbar, [class*="button"]');
        if (sibling) {
          console.debug('[Nyx MCP] Found button container (sibling fallback)');
          return sibling;
        }
        // Return parent if no sibling found
        return parent;
      }
    }
    return null;
  }

  // Create MCP button
  function createMCPButton(style) {
    const button = document.createElement('button');
    button.className = 'nyx-mcp-button';
    button.id = 'nyx-mcp-button';
    button.setAttribute('aria-label', 'Nyx MCP');
    button.setAttribute('title', 'Nyx MCP - Insert tools and instructions');
    
    // Button content - safely create elements
    const iconSpan = document.createElement('span');
    iconSpan.className = 'nyx-mcp-icon';
    
    // Create SVG safely
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 36 36');
    svg.setAttribute('fill', 'none');
    
    const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    outerCircle.setAttribute('cx', '18');
    outerCircle.setAttribute('cy', '18');
    outerCircle.setAttribute('r', '16');
    outerCircle.setAttribute('stroke', 'url(#nyxBtnGrad)');
    outerCircle.setAttribute('stroke-width', '2');
    outerCircle.setAttribute('fill', 'none');
    
    const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerCircle.setAttribute('cx', '18');
    innerCircle.setAttribute('cy', '18');
    innerCircle.setAttribute('r', '4');
    innerCircle.setAttribute('fill', 'url(#nyxBtnGrad)');
    
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'nyxBtnGrad');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#00d4ff');
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#8b5cf6');
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    
    svg.appendChild(outerCircle);
    svg.appendChild(innerCircle);
    svg.appendChild(defs);
    iconSpan.appendChild(svg);
    
    const textSpan = document.createElement('span');
    textSpan.className = 'nyx-mcp-text';
    textSpan.textContent = 'MCP';
    
    button.appendChild(iconSpan);
    button.appendChild(textSpan);
    
    // Click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMCPPopover(button);
    });
    
    return button;
  }

  // Create MCP popover
  function createMCPPopover() {
    const popover = document.createElement('div');
    popover.id = 'nyx-mcp-popover';
    popover.className = 'nyx-mcp-popover';
    // Create header
    const header = document.createElement('div');
    header.className = 'nyx-mcp-popover-header';
    
    const titleSpan = document.createElement('span');
    titleSpan.className = 'nyx-mcp-popover-title';
    titleSpan.textContent = 'Nyx MCP';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'nyx-mcp-popover-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    
    header.appendChild(titleSpan);
    header.appendChild(closeBtn);
    
    // Create content div
    const content = document.createElement('div');
    content.className = 'nyx-mcp-popover-content';
    
    // Create Insert button
    const insertBtn = document.createElement('button');
    insertBtn.className = 'nyx-mcp-action';
    insertBtn.dataset.action = 'insert';
    
    const insertSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    insertSvg.setAttribute('width', '16');
    insertSvg.setAttribute('height', '16');
    insertSvg.setAttribute('viewBox', '0 0 24 24');
    insertSvg.setAttribute('fill', 'none');
    insertSvg.setAttribute('stroke', 'currentColor');
    insertSvg.setAttribute('stroke-width', '2');
    
    const insertPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    insertPath.setAttribute('d', 'M12 5v14M5 12h14');
    insertSvg.appendChild(insertPath);
    
    const insertSpan = document.createElement('span');
    insertSpan.textContent = 'Insert';
    
    insertBtn.appendChild(insertSvg);
    insertBtn.appendChild(insertSpan);
    
    // Create Attach button
    const attachBtn = document.createElement('button');
    attachBtn.className = 'nyx-mcp-action';
    attachBtn.dataset.action = 'attach';
    
    const attachSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    attachSvg.setAttribute('width', '16');
    attachSvg.setAttribute('height', '16');
    attachSvg.setAttribute('viewBox', '0 0 24 24');
    attachSvg.setAttribute('fill', 'none');
    attachSvg.setAttribute('stroke', 'currentColor');
    attachSvg.setAttribute('stroke-width', '2');
    
    const attachPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    attachPath.setAttribute('d', 'M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48');
    attachSvg.appendChild(attachPath);
    
    const attachSpan = document.createElement('span');
    attachSpan.textContent = 'Attach';
    
    attachBtn.appendChild(attachSvg);
    attachBtn.appendChild(attachSpan);
    
    // Create Configure button
    const configBtn = document.createElement('button');
    configBtn.className = 'nyx-mcp-action';
    configBtn.dataset.action = 'configure';
    
    const configSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    configSvg.setAttribute('width', '16');
    configSvg.setAttribute('height', '16');
    configSvg.setAttribute('viewBox', '0 0 24 24');
    configSvg.setAttribute('fill', 'none');
    configSvg.setAttribute('stroke', 'currentColor');
    configSvg.setAttribute('stroke-width', '2');
    
    const configCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    configCircle.setAttribute('cx', '12');
    configCircle.setAttribute('cy', '12');
    configCircle.setAttribute('r', '3');
    
    const configPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    configPath.setAttribute('d', 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z');
    
    configSvg.appendChild(configCircle);
    configSvg.appendChild(configPath);
    
    const configSpan = document.createElement('span');
    configSpan.textContent = 'Configure';
    
    configBtn.appendChild(configSvg);
    configBtn.appendChild(configSpan);
    
    // Assemble popover
    content.appendChild(insertBtn);
    content.appendChild(attachBtn);
    content.appendChild(configBtn);
    
    popover.appendChild(header);
    popover.appendChild(content);
    
    // Close button handler
    popover.querySelector('.nyx-mcp-popover-close').addEventListener('click', () => {
      hideMCPPopover();
    });
    
    // Action handlers
    popover.querySelectorAll('.nyx-mcp-action').forEach(action => {
      action.addEventListener('click', (e) => {
        const actionType = e.currentTarget.dataset.action;
        handleMCPAction(actionType);
      });
    });
    
    return popover;
  }

  // Toggle MCP popover
  function toggleMCPPopover(button) {
    let popover = document.getElementById('nyx-mcp-popover');
    
    if (popover && popover.classList.contains('visible')) {
      hideMCPPopover();
      return;
    }
    
    if (!popover) {
      popover = createMCPPopover();
      document.body.appendChild(popover);
    }
    
    // Position popover relative to button
    const buttonRect = button.getBoundingClientRect();
    popover.style.position = 'fixed';
    popover.style.left = `${buttonRect.left}px`;
    popover.style.top = `${buttonRect.top - popover.offsetHeight - 8}px`;
    popover.style.zIndex = '999999';
    
    // Show popover
    requestAnimationFrame(() => {
      popover.classList.add('visible');
    });
    
    // Mark button as active
    button.classList.add('active');
  }

  // Hide MCP popover
  function hideMCPPopover() {
    const popover = document.getElementById('nyx-mcp-popover');
    const button = document.getElementById('nyx-mcp-button');
    
    if (popover) {
      popover.classList.remove('visible');
    }
    if (button) {
      button.classList.remove('active');
    }
  }

  // Handle MCP actions
  function handleMCPAction(action) {
    console.debug('[Nyx MCP] Action triggered:', action);
    
    switch (action) {
      case 'insert':
        console.debug('[Nyx MCP] Sending insert message to all frames');
        // Send to all frames in this tab
        chrome.runtime.sendMessage({ type: 'NYX_INSERT_TEXT', text: 'test message' });
        
        // Also try direct window postMessage as fallback
        window.postMessage({ type: 'NYX_INSERT_TEXT', text: 'test message' }, '*');
        break;
      case 'attach':
        chrome.runtime.sendMessage({ type: 'NYX_MCP_ACTION', action: 'attach' });
        break;
      case 'configure':
        chrome.runtime.sendMessage({ type: 'NYX_MCP_ACTION', action: 'configure' });
        break;
    }
    
    hideMCPPopover();
  }

  // Inject MCP button
  function injectMCPButton() {
    const config = getSiteConfig();
    const input = findChatInput(config);
    const container = findButtonContainer(config, input);
    
    if (!container) {
      console.debug('[Nyx MCP] Could not find button container, retrying...');
      return false;
    }
    
    // Check if button already exists
    if (document.getElementById('nyx-mcp-button')) {
      return true;
    }
    
    const button = createMCPButton(config.buttonStyle);
    
    // Insert button at the beginning of container
    if (container.firstChild) {
      container.insertBefore(button, container.firstChild);
    } else {
      container.appendChild(button);
    }
    
    console.debug('[Nyx MCP] Button injected successfully');
    return true;
  }

  // Initialize injector
  function init() {
    console.debug('[Nyx MCP] Initializing injector for:', window.location.hostname);
    
    // Special handling for claude.ai
    if (window.location.hostname.includes('claude.ai')) {
      console.debug('[Nyx MCP] Using balanced approach for Claude');
      
      // Wait for React to partially load but inject before full hydration
      const checkAndInject = () => {
        // Look for React root
        const reactRoot = document.getElementById('__next');
        if (reactRoot && reactRoot.children.length > 0) {
          console.debug('[Nyx MCP] React root found, injecting...');
          injectMCPButton();
          return true;
        }
        return false;
      };
      
      // Try multiple times during load
      if (!checkAndInject()) {
        const intervals = [500, 1000, 2000, 3000];
        intervals.forEach(delay => {
          setTimeout(() => {
            if (!document.getElementById('nyx-mcp-button')) {
              checkAndInject();
            }
          }, delay);
        });
      }
      
      // Also try after DOMContentLoaded
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          if (!document.getElementById('nyx-mcp-button')) {
            checkAndInject();
          }
        }, 100);
      });
      
      // And after full load as last resort
      window.addEventListener('load', () => {
        setTimeout(() => {
          if (!document.getElementById('nyx-mcp-button')) {
            console.debug('[Nyx MCP] Final injection attempt');
            injectMCPButton();
          }
        }, 500);
      });
      
      return; // Skip normal flow for Claude
    }
    
    // Normal flow for other sites
    if (!injectMCPButton()) {
      // Retry with delays
      setTimeout(injectMCPButton, 1000);
      setTimeout(injectMCPButton, 3000);
    }
    
    // Watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      let shouldInject = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if added node contains chat input or button container
              if (node.querySelector('textarea') || 
                  node.classList?.contains('chat-input') ||
                  node.classList?.contains('input-area')) {
                shouldInject = true;
                break;
              }
            }
          }
        }
      }
      
      if (shouldInject && !document.getElementById('nyx-mcp-button')) {
        injectMCPButton();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Handle clicks outside popover to close it
    document.addEventListener('click', (e) => {
      const popover = document.getElementById('nyx-mcp-popover');
      const button = document.getElementById('nyx-mcp-button');
      
      if (popover && button && 
          !popover.contains(e.target) && 
          !button.contains(e.target)) {
        hideMCPPopover();
      }
    });
    
    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideMCPPopover();
      }
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for external access
  window.NyxMCPButton = {
    inject: injectMCPButton,
    showPopover: () => {
      const button = document.getElementById('nyx-mcp-button');
      if (button) toggleMCPPopover(button);
    },
    hidePopover: hideMCPPopover
  };

})();
