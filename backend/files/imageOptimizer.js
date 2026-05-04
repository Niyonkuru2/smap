/**
 * Image Optimizer for Backend
 * Server-side image optimization with WebP conversion and compression
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Image optimizer for server-side image processing
 * 
 * @typedef {Object} ImageOptimizationOptions
 * @property {number} [maxWidth=1920] - Maximum width in pixels
 * @property {number} [maxHeight=1080] - Maximum height in pixels
 * @property {number} [quality=80] - Compression quality (0-100)
 * @property {'webp'|'jpeg'|'png'} [format='webp'] - Output format
 * @property {Object} [resize] - Resize options
 * @property {'cover'|'contain'|'fill'|'inside'|'outside'} [resize.fit] - How to fit image
 * @property {string} [resize.position] - Position within fit
 */

class ImageOptimizer {
  #uploadsDir;
  #optimizedDir;
  #defaultOptions = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 80,
    format: 'webp',
    resize: {
      fit: 'inside',
      position: 'center',
    },
  };

  constructor(uploadsPath = './uploads', optimizedPath = './uploads/optimized') {
    this.#uploadsDir = uploadsPath;
    this.#optimizedDir = optimizedPath;
    this.#ensureDirectories();
  }

  /**
   * Ensure upload directories exist
   * @private
   */
  async #ensureDirectories() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.optimizedDir, { recursive: true });
    } catch (error) {
      console.error('❌ Failed to create directories:', error);
    }
  }

  /**
   * Optimize uploaded image
   * @param {string} inputPath - Path to input image file
   * @param {ImageOptimizationOptions} [options] - Optimization options
   * @returns {Promise<Object>} Optimization result with success, sizes, and compression ratio
   */
  async optimizeImage(
    inputPath,
    options = {}
  ) {
    try {
      const mergedOptions = { ...this.#defaultOptions, ...options };
      
      // Get original file size
      const stats = await fs.stat(inputPath);
      const originalSize = stats.size;

      // Generate output filename
      const basename = path.basename(inputPath, path.extname(inputPath));
      const outputFilename = `${basename}-opt.${mergedOptions.format === 'webp' ? 'webp' : mergedOptions.format}`;
      const outputPath = path.join(this.#optimizedDir, outputFilename);

      // Optimize image
      let transformer = sharp(inputPath);

      // Resize if needed
      if (mergedOptions.resize) {
        transformer = transformer.resize(mergedOptions.maxWidth, mergedOptions.maxHeight, {
          fit: mergedOptions.resize.fit,
          position: mergedOptions.resize.position,
        });
      }

      // Convert to desired format
      switch (mergedOptions.format) {
        case 'webp':
          transformer = transformer.webp({ quality: mergedOptions.quality, effort: 6 });
          break;
        case 'jpeg':
          transformer = transformer.jpeg({ quality: mergedOptions.quality, progressive: true });
          break;
        case 'png':
          transformer = transformer.png({ compressionLevel: 9 });
          break;
      }

      // Save optimized image
      await transformer.toFile(outputPath);

      // Get optimized file size
      const optimizedStats = await fs.stat(outputPath);
      const optimizedSize = optimizedStats.size;
      const compressionRatio = ((1 - optimizedSize / originalSize) * 100).toFixed(2);

      console.log(`✅ Image optimized: ${basename}`);
      console.log(`   Original: ${this.formatBytes(originalSize)}`);
      console.log(`   Optimized: ${this.formatBytes(optimizedSize)}`);
      console.log(`   Compression: ${compressionRatio}%`);

      return {
        success: true,
        originalSize,
        optimizedSize,
        compressionRatio: `${compressionRatio}%`,
        outputPath,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Image optimization failed:', errorMessage);
      return {
        success: false,
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: '0%',
        outputPath: '',
        error: errorMessage,
      };
    }
  }

  /**
   * Generate responsive image versions
   * @param {string} inputPath - Path to input image
   * @param {string} baseName - Base name for output files
   * @returns {Promise<Object>} Object with size keys mapping to output filenames
   */
  async generateResponsiveVersions(
    inputPath,
    baseName
  ) {
    const sizes = {
      thumbnail: 300,
      small: 640,
      medium: 1024,
      large: 1920,
    };

    const versions = {};

    try {
      for (const [key, width] of Object.entries(sizes)) {
        const result = await this.optimizeImage(inputPath, {
          maxWidth: width,
          maxHeight: Math.floor(width * 0.75),
          format: 'webp',
        });

        if (result.success) {
          versions[key] = path.basename(result.outputPath);
        }
      }

      console.log(`✅ Generated ${Object.keys(versions).length} responsive versions`);
      return versions;
    } catch (error) {
      console.error('❌ Failed to generate responsive versions:', error);
      return {};
    }
  }

  /**
   * Batch optimize images in directory
   * @param {string} inputDir - Directory containing images
   * @returns {Promise<Object>} Summary with counts and sizes
   */
  async batchOptimize(inputDir) {
    try {
      const files = await fs.readdir(inputDir);
      const imageFiles = files.filter(f => /\.(jpg|png|jpeg|webp)$/i.test(f));

      let processed = 0;
      let failed = 0;
      let totalSize = 0;
      let optimizedSize = 0;

      for (const file of imageFiles) {
        const inputPath = path.join(inputDir, file);
        const result = await this.optimizeImage(inputPath);

        if (result.success) {
          processed++;
          totalSize += result.originalSize;
          optimizedSize += result.optimizedSize;
        } else {
          failed++;
        }
      }

      console.log(`\n📊 Batch Optimization Summary:`);
      console.log(`   Processed: ${processed}`);
      console.log(`   Failed: ${failed}`);
      console.log(`   Original Total: ${this.formatBytes(totalSize)}`);
      console.log(`   Optimized Total: ${this.formatBytes(optimizedSize)}`);
      console.log(`   Compression: ${((1 - optimizedSize / totalSize) * 100).toFixed(2)}%`);

      return { processed, failed, totalSize, optimizedSize };
    } catch (error) {
      console.error('❌ Batch optimization failed:', error);
      return { processed: 0, failed: 0, totalSize: 0, optimizedSize: 0 };
    }
  }

  /**
   * Format bytes to human-readable size
   * @private
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted string like "5.5 MB"
   */
  #formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Create a fast thumbnail for preview
   * @param {string} inputPath - Path to input image
   * @param {number} [size=150] - Thumbnail size in pixels
   * @returns {Promise<Buffer>} Thumbnail image buffer
   */
  async createThumbnail(inputPath, size = 150) {
    return sharp(inputPath)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .webp({ quality: 70 })
      .toBuffer();
  }

  /**
   * Get image metadata
   * @param {string} inputPath - Path to image file
   * @returns {Promise<Object>} Image metadata (width, height, format, etc.)
   */
  async getImageMetadata(inputPath) {
    const metadata = await sharp(inputPath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
    };
  }
}

export default ImageOptimizer;
