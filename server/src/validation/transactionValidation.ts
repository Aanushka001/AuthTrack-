// import Joi from 'joi';

// export const transactionValidation = {
//   analyzeTransaction: Joi.object({
//     userId: Joi.string().required().messages({
//       'string.empty': 'User ID is required',
//       'any.required': 'User ID is required'
//     }),
    
//     amount: Joi.number().positive().required().messages({
//       'number.base': 'Amount must be a number',
//       'number.positive': 'Amount must be positive',
//       'any.required': 'Amount is required'
//     }),
    
//     merchantId: Joi.string().required().messages({
//       'string.empty': 'Merchant ID is required',
//       'any.required': 'Merchant ID is required'
//     }),
    
//     merchantName: Joi.string().optional(),
    
//     currency: Joi.string().length(3).uppercase().default('USD').messages({
//       'string.length': 'Currency must be 3 characters long'
//     }),
    
//     transactionId: Joi.string().optional(),
    
//     timestamp: Joi.date().optional(),
    
//     deviceFingerprint: Joi.string().optional(),
    
//     ipAddress: Joi.string().ip().optional(),
    
//     location: Joi.object({
//       latitude: Joi.number().min(-90).max(90).required(),
//       longitude: Joi.number().min(-180).max(180).required(),
//       country: Joi.string().required(),
//       city: Joi.string().required(),
//       region: Joi.string().optional()
//     }).optional()
//   }),

//   updateStatus: Joi.object({
//     status: Joi.string().valid('approved', 'declined', 'investigating', 'pending').required().messages({
//       'any.only': 'Status must be one of: approved, declined, investigating, pending',
//       'any.required': 'Status is required'
//     }),
    
//     notes: Joi.string().max(1000).optional().messages({
//       'string.max': 'Notes cannot exceed 1000 characters'
//     })
//   }),

//   bulkReview: Joi.object({
//     transactionIds: Joi.array().items(Joi.string()).min(1).max(100).required().messages({
//       'array.min': 'At least one transaction ID is required',
//       'array.max': 'Cannot process more than 100 transactions at once',
//       'any.required': 'Transaction IDs are required'
//     }),
    
//     action: Joi.string().valid('approve', 'decline', 'investigate').required().messages({
//       'any.only': 'Action must be one of: approve, decline, investigate',
//       'any.required': 'Action is required'
//     }),
    
//     notes: Joi.string().max(1000).optional().messages({
//       'string.max': 'Notes cannot exceed 1000 characters'
//     })
//   }),

//   getTransactions: Joi.object({
//     userId: Joi.string().optional(),
//     status: Joi.string().valid('approved', 'declined', 'investigating', 'pending').optional(),
//     riskLevel: Joi.string().valid('low', 'medium', 'high').optional(),
//     page: Joi.number().integer().min(1).default(1),
//     limit: Joi.number().integer().min(1).max(100).default(20),
//     sortBy: Joi.string().valid('timestamp', 'amount', 'riskScore', 'status').default('timestamp'),
//     sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
//     startDate: Joi.date().optional(),
//     endDate: Joi.date().optional()
//   }),

//   exportTransactions: Joi.object({
//     userId: Joi.string().optional(),
//     status: Joi.string().valid('approved', 'declined', 'investigating', 'pending').optional(),
//     format: Joi.string().valid('json', 'csv').default('json'),
//     startDate: Joi.date().optional(),
//     endDate: Joi.date().optional()
//   })
// };

// C:\Users\aanus\Downloads\AutheTrack\AutheTrack\server\src\validation\transactionValidation.ts
import Joi from 'joi';

export const transactionValidation = {
  analyzeTransaction: Joi.object({
    transactionId: Joi.string().optional(),

    userId: Joi.string().required().messages({
      'string.empty': 'User ID is required',
      'any.required': 'User ID is required'
    }),

    amount: Joi.number().positive().required().messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    }),

    currency: Joi.string().length(3).uppercase().default('USD').messages({
      'string.length': 'Currency must be 3 characters long'
    }),

    merchantId: Joi.string().required().messages({
      'string.empty': 'Merchant ID is required',
      'any.required': 'Merchant ID is required'
    }),

    merchantName: Joi.string().optional(),

    timestamp: Joi.date().optional(),
    deviceFingerprint: Joi.string().optional(),
    ipAddress: Joi.string().ip().optional(),

    location: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      country: Joi.string().required(),
      city: Joi.string().required(),
      region: Joi.string().optional()
    }).optional()
  }),

  getTransactions: Joi.object({
    userId: Joi.string().optional(),
    status: Joi.string()
      .valid('pending', 'approved', 'declined', 'investigating')
      .optional(),
    riskLevel: Joi.string().valid('low', 'medium', 'high').optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string()
      .valid('timestamp', 'amount', 'riskScore', 'status')
      .default('timestamp'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  }),

  updateStatus: Joi.object({
    status: Joi.string()
      .valid('approved', 'declined', 'investigating', 'pending')
      .required()
      .messages({
        'any.only':
          'Status must be one of: approved, declined, investigating, pending',
        'any.required': 'Status is required'
      }),
    notes: Joi.string().max(1000).optional().messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    })
  }),

  bulkReview: Joi.object({
    transactionIds: Joi.array()
      .items(Joi.string())
      .min(1)
      .max(100)
      .required()
      .messages({
        'array.min': 'At least one transaction ID is required',
        'array.max': 'Cannot process more than 100 transactions at once',
        'any.required': 'Transaction IDs are required'
      }),
    action: Joi.string()
      .valid('approve', 'decline', 'investigate')
      .required()
      .messages({
        'any.only':
          'Action must be one of: approve, decline, investigate',
        'any.required': 'Action is required'
      }),
    notes: Joi.string().max(1000).optional().messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    })
  }),

  searchTransactions: Joi.object({
    searchTerm: Joi.string().min(1).required(),
    searchType: Joi.string()
      .valid('all', 'transactionId', 'merchantId', 'merchantName', 'amount')
      .default('all'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  exportTransactions: Joi.object({
    userId: Joi.string().optional(),
    status: Joi.string()
      .valid('approved', 'declined', 'investigating', 'pending')
      .optional(),
    format: Joi.string().valid('json', 'csv').default('json'),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  })
};
