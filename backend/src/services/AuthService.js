import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import UserRepository from '../repositories/UserRepository.js';
import EmailService from './EmailService.js';
import pool from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';
const JWT_EXPIRES_IN = '24h';

class AuthService {
    constructor() {
        this.userRepo = UserRepository;
        this.emailService = EmailService;
    }

  async sendVerificationEmail(email, name = 'User', language = 'en') {
    try {
        console.log('Sending verification email to:', email);
        
        let existingUser = await this.userRepo.findByEmail(email);
        
        // If user exists and registration is completed, reject
        if (existingUser && existingUser.registration_completed === true) {
            return {
                success: false,
                message: 'Email already registered. Please login instead.',
                email: email,
                emailSent: false
            };
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        let user;
        
        if (existingUser) {
            // Update existing user's name and reset registration flag
            user = await this.userRepo.update(existingUser.id, { 
                name: name,
                verified: false,
                registration_completed: false
            });
        } else {
            const tempPasswordHash = await bcrypt.hash('temp_' + Date.now(), 12);
            user = await this.userRepo.createWithVerification({
                email,
                password_hash: tempPasswordHash,
                name: name,
                role: 'consumer',
                verified: false,
                registration_completed: false
            });
        }

        // Store verification code
        await this.userRepo.storeVerificationCode(email, verificationCode, expiresAt);

        const emailResult = await this.emailService.sendVerificationEmail(
            email,
            name,
            verificationCode,
            language
        );

        return {
            success: emailResult.success,
            message: emailResult.success 
                ? 'Verification code sent to your email'
                : 'Failed to send verification email. Please try again.',
            email: email,
            emailSent: emailResult.success,
            expiresIn: '10 minutes'
        };
    } catch (error) {
        console.error('Send verification email error:', error);
        return {
            success: false,
            message: error.message || 'Failed to send verification email',
            email: email,
            emailSent: false
        };
    }
}

    async verifyEmailCode(email, code) {
        try {
            console.log('Verifying code for email:', email);
            
            const user = await this.userRepo.findByEmail(email);
            
            if (!user) {
                return {
                    success: false,
                    message: 'No verification request found. Please request a new code.',
                    email: email,
                    codeVerified: false
                };
            }

            if (user.verified === true) {
                return {
                    success: false,
                    message: 'Email is already verified. Please login.',
                    email: email,
                    codeVerified: false
                };
            }

            const verifiedCode = await this.userRepo.verifyCode(email, code);
            
            if (!verifiedCode) {
                return {
                    success: false,
                    message: 'Invalid or expired verification code. Please request a new code.',
                    email: email,
                    codeVerified: false
                };
            }

            const verifiedUser = await this.userRepo.verifyUser(email);
            
            if (!verifiedUser) {
                return {
                    success: false,
                    message: 'Failed to verify user. Please try again.',
                    email: email,
                    codeVerified: false
                };
            }

            return {
                success: true,
                message: 'Email verified successfully! You can now complete your registration.',
                email: email,
                name: verifiedUser.name,
                codeVerified: true
            };
        } catch (error) {
            console.error('Verify email code error:', error);
            return {
                success: false,
                message: error.message || 'Failed to verify code',
                email: email,
                codeVerified: false
            };
        }
    }

async completeRegistration(userData) {
    try {
        const { email, password, name, role = 'consumer', phone = null, marketId = null, province = null, district = null } = userData;

        console.log('Completing registration for email:', email);

        const existingUser = await this.userRepo.findByEmail(email);
        
        if (!existingUser) {
            return {
                success: false,
                message: 'Please request a verification code first.',
                registered: false
            };
        }

        // If user already completed registration
        if (existingUser.registration_completed === true) {
            return {
                success: false,
                message: 'Account already exists. Please login instead.',
                registered: false
            };
        }

        // If email not verified
        if (!existingUser.verified) {
            return {
                success: false,
                message: 'Please verify your email first before completing registration.',
                requiresVerification: true,
                email: email,
                registered: false
            };
        }

        // Complete registration - update user with real data
        const password_hash = await bcrypt.hash(password, 12);

        const updatedUser = await this.userRepo.update(existingUser.id, {
            password_hash: password_hash,
            name: name,
            role: role,
            phone: phone,
            market_id: marketId,
            province: province,
            district: district,
            registration_completed: true
        });

        // Clean up verification codes
        await pool.query('DELETE FROM verification_codes WHERE email = $1', [email]);

        const token = this.generateToken(updatedUser);

        // Send welcome email
        this.emailService.sendWelcomeEmail(email, updatedUser.name, 'en').catch(err => {
            console.error('Welcome email failed:', err.message);
        });

        return {
            success: true,
            message: 'Registration completed successfully!',
            token,
            user: this.sanitizeUser(updatedUser),
            registered: true
        };
    } catch (error) {
        console.error('Complete registration error:', error);
        return {
            success: false,
            message: error.message || 'Registration failed',
            registered: false
        };
    }
}

async verifyEmailCode(email, code) {
    try {
        console.log('Verifying code for email:', email);
        
        const user = await this.userRepo.findByEmail(email);
        
        if (!user) {
            return {
                success: false,
                message: 'No verification request found. Please request a new code.',
                email: email,
                codeVerified: false
            };
        }

        if (user.registration_completed === true) {
            return {
                success: false,
                message: 'Email is already registered. Please login.',
                email: email,
                codeVerified: false
            };
        }

        const verifiedCode = await this.userRepo.verifyCode(email, code);
        
        if (!verifiedCode) {
            return {
                success: false,
                message: 'Invalid or expired verification code. Please request a new code.',
                email: email,
                codeVerified: false
            };
        }

        const verifiedUser = await this.userRepo.update(user.id, { verified: true });
        
        if (!verifiedUser) {
            return {
                success: false,
                message: 'Failed to verify user. Please try again.',
                email: email,
                codeVerified: false
            };
        }

        return {
            success: true,
            message: 'Email verified successfully! You can now complete your registration.',
            email: email,
            name: verifiedUser.name,
            codeVerified: true
        };
    } catch (error) {
        console.error('Verify email code error:', error);
        return {
            success: false,
            message: error.message || 'Failed to verify code',
            email: email,
            codeVerified: false
        };
    }
}

    async login(email, password, ipAddress) {
        try {
            const user = await this.userRepo.findByEmail(email);
            
            if (!user) {
                return {
                    success: false,
                    message: 'Invalid login credentials',
                    loggedIn: false
                };
            }

            if (!user.verified) {
                return {
                    success: false,
                    message: 'Please verify your email before logging in.',
                    requiresVerification: true,
                    email: email,
                    loggedIn: false
                };
            }

            if (user.is_active === false) {
                return {
                    success: false,
                    message: 'Your account has been deactivated. Please contact support.',
                    loggedIn: false
                };
            }

            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return {
                    success: false,
                    message: 'Invalid login credentials',
                    loggedIn: false
                };
            }

            await this.userRepo.updateLastLogin(user.id);
            
            const token = this.generateToken(user);

            return {
                success: true,
                message: 'Login successful',
                token,
                user: this.sanitizeUser(user),
                loggedIn: true
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.message || 'Login failed',
                loggedIn: false
            };
        }
    }

    async resendVerificationCode(email, language = 'en') {
        try {
            const user = await this.userRepo.findByEmail(email);
            
            if (user && user.verified === true) {
                return {
                    success: false,
                    message: 'Email is already verified. Please login.',
                    email: email,
                    emailSent: false
                };
            }

            const name = user?.name || 'User';
            return await this.sendVerificationEmail(email, name, language);
        } catch (error) {
            console.error('Resend verification error:', error);
            return {
                success: false,
                message: error.message || 'Failed to resend verification code',
                email: email,
                emailSent: false
            };
        }
    }

   async forgotPassword(email, language = 'en') {
    try {
        const user = await this.userRepo.findByEmail(email);

        if (!user || !user.verified) {
            return {
                success: true,
                message: 'If an account exists, you will receive a password reset code.',
                emailSent: false
            };
        }

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        // Delete old codes for this email (important)
        await pool.query(
            'DELETE FROM verification_codes WHERE email = $1',
            [email]
        );

        
        await pool.query(
            `INSERT INTO verification_codes (email, code, expires_at)
             VALUES ($1, $2, $3)`,
            [email, resetCode, expiresAt]
        );

        // Send email (only code now)
        await this.emailService.sendPasswordResetEmail(
            email,
            user.name,
            resetCode,
            language
        );

        return {
            success: true,
            message: 'Reset code sent to your email.',
            emailSent: true
        };

    } catch (error) {
        console.error('Forgot password error:', error);
        return {
            success: false,
            message: error.message || 'Failed to process request',
            emailSent: false
        };
    }
}

async resetPassword(email, code, newPassword) {
    try {
        const user = await this.userRepo.findByEmail(email);

        if (!user) {
            return {
                success: false,
                message: 'User not found',
                reset: false
            };
        }

        const record = await this.userRepo.getLatestVerificationCode(email);

        if (!record) {
            return {
                success: false,
                message: 'No reset request found',
                reset: false
            };
        }

        if (record.used) {
            return {
                success: false,
                message: 'Reset code already used',
                reset: false
            };
        }

        if (String(record.code).trim() !== String(code).trim()) {
            return {
                success: false,
                message: 'Invalid reset code',
                reset: false
            };
        }

        if (new Date() > new Date(record.expires_at)) {
            return {
                success: false,
                message: 'Reset code has expired',
                reset: false
            };
        }

        const password_hash = await bcrypt.hash(newPassword, 12);

        await this.userRepo.update(user.id, {
            password_hash
        });

        //  mark as used AFTER success
        await this.userRepo.markVerificationCodeAsUsed(record.id);

        return {
            success: true,
            message: 'Password reset successfully',
            reset: true
        };

    } catch (error) {
        console.error('Reset password error:', error);

        return {
            success: false,
            message: error.message || 'Password reset failed',
            reset: false
        };
    }
}

    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await this.userRepo.findById(userId);
            
            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                    changed: false
                };
            }

            const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
            if (!validPassword) {
                return {
                    success: false,
                    message: 'Current password is incorrect',
                    changed: false
                };
            }

            const password_hash = await bcrypt.hash(newPassword, 12);
            await this.userRepo.update(userId, { password_hash });

            return {
                success: true,
                message: 'Password changed successfully',
                changed: true
            };
        } catch (error) {
            console.error('Change password error:', error);
            return {
                success: false,
                message: error.message || 'Password change failed',
                changed: false
            };
        }
    }

    async getProfile(userId) {
        try {
            const user = await this.userRepo.findById(userId);
            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                    user: null
                };
            }
            return {
                success: true,
                user: this.sanitizeUser(user)
            };
        } catch (error) {
            console.error('Get profile error:', error);
            return {
                success: false,
                message: error.message || 'Failed to get profile',
                user: null
            };
        }
    }

    async updateProfile(userId, updates) {
        try {
            const allowedUpdates = ['name', 'phone', 'province', 'district', 'market_id', 'avatar_url'];
            const filteredUpdates = {};
            
            for (const key of allowedUpdates) {
                if (updates[key] !== undefined) {
                    filteredUpdates[key] = updates[key];
                }
            }

            const updatedUser = await this.userRepo.update(userId, filteredUpdates);
            
            return {
                success: true,
                message: 'Profile updated successfully',
                user: this.sanitizeUser(updatedUser)
            };
        } catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                message: error.message || 'Profile update failed',
                user: null
            };
        }
    }

    generateToken(user) {
        return jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role,
                name: user.name 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    }

    sanitizeUser(user) {
        if (!user) return null;
        const { 
            password_hash, 
            reset_token,
            reset_code,
            reset_expires,
            ...sanitized 
        } = user;
        return sanitized;
    }
}

export default new AuthService();