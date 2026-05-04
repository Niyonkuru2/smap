/**
 * Email service module - Main entry point
 * Provides email sending capabilities with template support
 */

import EmailService from '../EmailService.js';
import * as templates from './templates.js';

// Re-export everything
export * from '../EmailService.js';
export * from './templates.js';

export default EmailService;