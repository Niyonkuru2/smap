import pool from '../config/database.js';
import AuthService from '../services/AuthService.js';

export const sendVerificationEmail = async (req, res) => {
    try {
        const { email, name, language = 'en' } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const result = await AuthService.sendVerificationEmail(email, name, language);
        const statusCode = result.success ? 200 : 400;
        res.status(statusCode).json(result);
    } catch (error) {
        console.error('Send verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const verifyEmailCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email and verification code are required'
            });
        }

        const result = await AuthService.verifyEmailCode(email, code);
        const statusCode = result.success ? 200 : 400;
        res.status(statusCode).json(result);
    } catch (error) {
        console.error('Verify code error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const completeRegistration = async (req, res) => {
    try {
        const { email, password, name, role, phone, marketId, province, district } = req.body;
        
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and name are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const result = await AuthService.completeRegistration({
            email,
            password,
            name,
            role,
            phone,
            marketId,
            province,
            district
        });
        
        const statusCode = result.success ? 201 : 400;
        res.status(statusCode).json(result);
    } catch (error) {
        console.error('Complete registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const result = await AuthService.login(email, password, req.ip);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            const statusCode = result.requiresVerification ? 403 : 401;
            res.status(statusCode).json(result);
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const resendVerificationCode = async (req, res) => {
    try {
        const { email, language = 'en' } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const result = await AuthService.resendVerificationCode(email, language);
        const statusCode = result.success ? 200 : 400;
        res.status(statusCode).json(result);
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email, language = 'en' } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const result = await AuthService.forgotPassword(email, language);
        res.status(200).json(result);
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        
        if (!email || !code || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, reset code, and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const result = await AuthService.resetPassword(email, code, newPassword);
        const statusCode = result.success ? 200 : 400;
        res.status(statusCode).json(result);
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        const result = await AuthService.changePassword(req.user.id, currentPassword, newPassword);
        const statusCode = result.success ? 200 : 400;
        res.status(statusCode).json(result);
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        const result = await AuthService.getProfile(req.user.id);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const updates = req.body;
        const result = await AuthService.updateProfile(req.user.id, updates);
        const statusCode = result.success ? 200 : 400;
        res.status(statusCode).json(result);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const verifyResetToken = async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({
            success: false,
            message: 'Token is required',
        });
    }

    const user = await pool.query(
        'SELECT * FROM users WHERE reset_token = $1 AND reset_expires > NOW()',
        [token]
    );

    if (user.rows.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired reset token',
            valid: false,
        });
    }

    res.json({
        success: true,
        message: 'Token is valid',
        valid: true,
    });
};