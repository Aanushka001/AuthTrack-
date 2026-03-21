
// ### server/src/config/swagger.ts

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SecureTrace API',
      version: '1.0.0',
      description: 'Real-time behavioral fraud detection API',
      contact: {
        name: 'SecureTrace Support',
        email: 'support@securetrace.ai'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.securetrace.ai' 
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Transaction: {
          type: 'object',
          required: ['id', 'userId', 'amount', 'currency', 'merchantId'],
          properties: {
            id: { type: 'string', description: 'Transaction ID' },
            userId: { type: 'string', description: 'User ID' },
            amount: { type: 'number', description: 'Transaction amount' },
            currency: { type: 'string', description: 'Currency code' },
            merchantId: { type: 'string', description: 'Merchant ID' },
            riskScore: { type: 'number', minimum: 0, maximum: 1 },
            status: { type: 'string', enum: ['approved', 'declined', 'investigating'] }
          }
        },
        RiskProfile: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            currentRiskScore: { type: 'number', minimum: 0, maximum: 1 },
            riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
            lastUpdated: { type: 'string', format: 'date-time' }
          }
        },
        FraudAlert: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            transactionId: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            status: { type: 'string', enum: ['open', 'investigating', 'resolved', 'false_positive'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts']
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }'
  }));
}
