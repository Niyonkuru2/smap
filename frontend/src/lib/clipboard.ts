// Clipboard utility with fallback for browsers that block Clipboard API

/**
 * Copy text to clipboard with fallback methods
 * Works even when Clipboard API is blocked by permissions policy
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Method 1: Try modern Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('Clipboard API failed, trying fallback method:', error);
      // Fall through to fallback methods
    }
  }

  // Method 2: Use execCommand (deprecated but still works)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make it invisible but focusable
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    // Try to copy
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      return true;
    }
  } catch (error) {
    console.error('execCommand fallback failed:', error);
  }

  // Method 3: Last resort - create a selection range
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'absolute';
    textArea.style.left = '-9999px';
    
    document.body.appendChild(textArea);
    
    // Select the text
    const selected = document.getSelection()!.rangeCount > 0
      ? document.getSelection()!.getRangeAt(0)
      : false;
    
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    // Restore previous selection
    if (selected) {
      document.getSelection()!.removeAllRanges();
      document.getSelection()!.addRange(selected);
    }
    
    return successful;
  } catch (error) {
    console.error('All clipboard methods failed:', error);
    return false;
  }
}

/**
 * Copy text to clipboard and show toast notification
 */
export async function copyToClipboardWithToast(
  text: string, 
  toast: any, 
  successMessage: string = 'Copied to clipboard!',
  errorMessage: string = 'Failed to copy. Please copy manually.'
): Promise<void> {
  const success = await copyToClipboard(text);
  
  if (success) {
    toast.success(successMessage);
  } else {
    toast.error(errorMessage);
  }
}
