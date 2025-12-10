// Enhanced error handling middleware with structured logging
const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Log error with context
  console.error(`[${timestamp}] [${requestId}] Error in ${req.method} ${req.path}:`, {
    error: err.message,
    stack: err.stack,
    body: req.body,
    query: req.query,
    headers: req.headers,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Determine error type and response
  let statusCode = 500;
  let message = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized access';
    errorCode = 'UNAUTHORIZED';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Access forbidden';
    errorCode = 'FORBIDDEN';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
    errorCode = 'NOT_FOUND';
  } else if (err.name === 'RateLimitError') {
    statusCode = 429;
    message = 'Rate limit exceeded';
    errorCode = 'RATE_LIMIT_EXCEEDED';
  }

  // Send structured error response
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: message,
      requestId: requestId,
      timestamp: timestamp,
      ...(process.env.NODE_ENV === 'development' && { 
        details: err.message,
        stack: err.stack 
      })
    }
  });
};

// 404 handler for unmatched routes
const notFoundHandler = (req, res) => {
  const timestamp = new Date().toISOString();
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.warn(`[${timestamp}] [${requestId}] 404 - Route not found: ${req.method} ${req.path}`);
  
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      requestId: requestId,
      timestamp: timestamp,
      availableRoutes: [
        'GET /health',
        'GET /api/festival/active',
        'POST /api/search',
        'GET /api/shops',
        'GET /api/items',
        'GET /api/ratings'
      ]
    }
  });
};

// Request ID middleware
const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  res.set('X-Request-ID', requestId);
  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  requestIdMiddleware
};