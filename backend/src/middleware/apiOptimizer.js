// Field selector - allows clients to request only needed fields
function fieldSelector(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    const fields = req.query.fields;

    if (fields && Array.isArray(data)) {
      const fieldArray = fields.split(',').map(f => f.trim());
      
      data = data.map(item => {
        const filtered = {};
        fieldArray.forEach(field => {
          if (item.hasOwnProperty(field)) {
            filtered[field] = item[field];
          }
        });
        return filtered;
      });
    }

    return originalJson(data);
  };

  next();
}

// Pagination helper
function paginate(options = {}) {
  return (req, res, next) => {
    const {
      defaultLimit = 20,
      maxLimit = 100,
    } = options;

    const limit = Math.min(
      parseInt(req.query.limit) || defaultLimit,
      maxLimit
    );
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    req.pagination = {
      limit,
      offset,
      page,
    };

    next();
  };
}

// Response compression stats logging
function logCompressionStats(req, res, next) {
  const originalSend = res.send.bind(res);
  
  res.send = function (data) {
    if (data) {
      const uncompressedSize = Buffer.byteLength(data);
      if (uncompressedSize > 1024) {
        console.log(`📊 Response size: ${(uncompressedSize / 1024).toFixed(2)} KB`);
      }
    }
    return originalSend(data);
  };

  next();
}

export {
  fieldSelector,
  paginate,
  logCompressionStats,
};
