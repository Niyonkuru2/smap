import VendorService from '../services/VendorService.js';

class VendorController {
  static async createVendor(req, res) {
    try {
      const vendor = await VendorService.createVendor(req.body);

      res.status(201).json({
        success: true,
        message: 'Vendor created successfully',
        data: vendor,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default VendorController;