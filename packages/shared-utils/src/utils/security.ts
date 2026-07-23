import DOMPurify from 'dompurify';
import { z } from 'zod';

/**
 * Sanitizes rich text or standard text inputs to prevent XSS.
 * Removes dangerous tags like <script>, <object>, <iframe>, etc.
 * Keeps standard formatting tags if allowed.
 */
export const sanitizeInput = (dirty: string, allowHtml = false): string => {
  if (!dirty) return "";
  if (!allowHtml) {
    // Strip all HTML entirely for raw text fields
    return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] }).trim();
  }
  
  // Allow basic safe HTML
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'class'],
  }).trim();
};

/**
 * Common Zod schemas for enterprise-grade frontend validation.
 */
export const EnterpriseValidation = {
  uuid: z.string().uuid("Invalid unique identifier format."),
  
  email: z.string()
    .email("Invalid email format.")
    .max(255, "Email is too long.")
    .trim(),
    
  password: z.string()
    .min(12, "Password must be at least 12 characters.")
    .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    .regex(/[a-z]/, "Password must contain a lowercase letter.")
    .regex(/[0-9]/, "Password must contain a number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character."),
    
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid international phone number format.")
    .optional()
    .or(z.literal('')),
    
  amount: z.number()
    .positive("Amount must be greater than zero.")
    .multipleOf(0.01, "Amount cannot have more than 2 decimal places."),
    
  accountNumber: z.string()
    .regex(/^\d{8,12}$/, "Invalid account number length or format."),
    
  routingNumber: z.string()
    .regex(/^\d{9}$/, "Routing number must be exactly 9 digits."),
    
  walletAddress: z.string()
    .regex(/^(0x)?[0-9a-fA-F]{40}$|^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, "Invalid crypto wallet address format."),
};
