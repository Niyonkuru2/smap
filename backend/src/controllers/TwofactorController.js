// 2FA Controllers
export const setup2FA = catchAsync(async (req, res) => {
    const result = await TwoFactorService.initiateSetup(req.user.id, req.user.email);
    res.json(result);
});

export const verify2FASetup = catchAsync(async (req, res) => {
    const { code } = req.body;
    const result = await TwoFactorService.completeSetup(req.user.id, code);
    res.json(result);
});

export const verify2FA = catchAsync(async (req, res) => {
    const { code } = req.body;
    const result = await TwoFactorService.verify(req.user.id, code);
    res.json(result);
});

export const disable2FA = catchAsync(async (req, res) => {
    const { code } = req.body;
    const result = await TwoFactorService.disable(req.user.id, code);
    res.json(result);
});

export const get2FAStatus = catchAsync(async (req, res) => {
    const status = await TwoFactorService.getStatus(req.user.id);
    res.json(status);
});

export const regenerateBackupCodes = catchAsync(async (req, res) => {
    const { code } = req.body;
    const result = await TwoFactorService.regenerateBackupCodes(req.user.id, code);
    res.json(result);
});