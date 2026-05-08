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
  static async getAllVendors(req, res) {
    try {
      const vendors = await VendorService.getAllVendors();

      res.status(200).json({
        success: true,
        message: 'Vendors fetched successfully',
        data: vendors,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  static async getVendorById(req, res) {
    try {
      const { id } = req.params;

      const vendor = await VendorService.getVendorById(id);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Vendor fetched successfully',
        data: vendor,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  static async updateVendor(req, res) {
    try {
      const { id } = req.params;
      const role = req.user?.role;

      const updatedVendor = await VendorService.updateVendor(
        id,
        req.body,
        role
      );

      res.status(200).json({
        success: true,
        message: 'Vendor updated successfully',
        data: updatedVendor,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async deleteVendor(req, res) {
    try {
      const { id } = req.params;

      const deleted = await VendorService.deleteVendor(id);

      res.status(200).json({
        success: true,
        message: 'Vendor deleted successfully',
        data: deleted,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default VendorController;