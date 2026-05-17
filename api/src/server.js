import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { expressjwt as jwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();

// --- Get current directory ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load environment variables ---
const PORT = process.env.PORT || 4000;
const JWK_URI = process.env.JWK_URI;
const AUDIENCE = process.env.AUDIENCE;
const ISSUER = process.env.ISSUER;

// --- Load certificate inventory data ---
const inventoryPath = path.join(__dirname, '../../data/cetificate-inventory.json');
let certificateData = [];

try {
  const rawData = fs.readFileSync(inventoryPath, 'utf-8');
  const jsonData = JSON.parse(rawData);
  certificateData = jsonData.Data || [];
  console.log(`Loaded ${certificateData.length} certificates from inventory`);
} catch (error) {
  console.error('Error loading certificate inventory:', error.message);
}

// --- Basic middleware ---
app.use(cors());
app.use(express.json());

// --- Swagger setup ---
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
swaggerDocument.info.title = process.env.SWAGGER_TITLE || swaggerDocument.info.title;
swaggerDocument.info.version = process.env.SWAGGER_VERSION || swaggerDocument.info.version;

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- JWT auth middleware (Azure AD compatible) ---
const jwtCheck = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: JWK_URI
  }),
  algorithms: ['RS256'],
  audience: AUDIENCE,
  issuer: ISSUER
});

// --- Helper function to apply filters ---
function applyFilters(data, filters) {
  return data.filter((cert) => {
    // HostName filter
    if (filters.hostName && !cert.HostName.toLowerCase().includes(filters.hostName.toLowerCase())) {
      return false;
    }

    // IPAddress filter
    if (filters.ipAddress && cert.IPAddress !== filters.ipAddress) {
      return false;
    }

    // VulnerabilityRating filter
    if (filters.vulnerabilityRating && cert.VulnerabilityRating !== filters.vulnerabilityRating) {
      return false;
    }

    // VulnerabilityNumericRating filter
    if (filters.vulnerabilityNumericRating !== undefined && cert.VulnerabilityNumericRating !== filters.vulnerabilityNumericRating) {
      return false;
    }

    // CertificateIsExpired filter
    if (filters.certificateIsExpired !== undefined && cert.CertificateIsExpired !== filters.certificateIsExpired) {
      return false;
    }

    // Port filter
    if (filters.port && cert.Port !== filters.port) {
      return false;
    }

    return true;
  });
}

// --- Helper function to apply sorting ---
function applySorting(data, sortField, sortOrder) {
  const validFields = [
    'HostName', 'IPAddress', 'Environment', 'Port', 'Thumbprint', 'Subject', 'Issuer',
    'CertificateIsTrusted', 'IssuanceDate', 'ExpirationDate', 'CertificateValidityPeriodInYears',
    'CertificateValidityPeriodInDays', 'CertificateIsExpired', 'IsWildcardCertificate',
    'IsSelfSignedCertificate', 'CertificateSubjectMatchesHostName', 'SignatureAlgorithm',
    'NegotiatedCipherSuites', 'CipherAlgorithm', 'CipherStrength', 'KeyExchangeAlgorithm',
    'KeySize', 'StrictTransportSecurity', 'SubjectAlternativeNames', 'Ssl2', 'Ssl3', 'Tls',
    'Tls11', 'Tls12', 'Tls13', 'ExpirationCategory', 'ExpirationRating', 'ExpirationNumericRating',
    'CertificateChainVulnerabilityTrustRating', 'CertificateChainTrustVulnerabilityNumericRating',
    'CertificateSubjectMatchesHostNameVulnerabilityRating', 'CertificateSubjectMatchesHostNameVulnerabilityNumericRating',
    'CertificateHasSANsVulnerabilityRating', 'CertificateHasSANsVulnerabilityNumericRating',
    'SignatureAlgorithmVulnerabilityRating', 'SignatureAlgorithmVulnerabilityNumericRating',
    'TlsProtocolVulnerabilityRating', 'TlsProtocolVulnerabilityNumericRating',
    'SelfSignedCertificateVulnerabilityRating', 'SelfSignedCertificateVulnerabilityNumericRating',
    'CertValidityPeriodVulnerabilityRating', 'CertValidityPeriodVulnerabilityNumericRating',
    'VulnerabilityCumulativeNumericRating', 'VulnerabilityRating', 'VulnerabilityNumericRating',
    'VulnerabilityRatingExplanation'
  ];

  // Return unsorted if field not valid
  if (!sortField || !validFields.includes(sortField)) {
    return data;
  }

  const direction = sortOrder === 'desc' ? -1 : 1;

  return data.sort((a, b) => {
    const valueA = a[sortField];
    const valueB = b[sortField];

    if (valueA === undefined || valueB === undefined) {
      return 0;
    }

    if (typeof valueA === 'string') {
      return valueA.localeCompare(valueB) * direction;
    }

    if (typeof valueA === 'number') {
      return (valueA - valueB) * direction;
    }

    if (typeof valueA === 'boolean') {
      return (valueA === valueB ? 0 : valueA ? -1 : 1) * direction;
    }

    return 0;
  });
}

// --- GET /certificates - Paginated, sortable, filterable certificates ---
app.get('/certificates', jwtCheck, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const sortField = req.query.sortField || 'HostName';
    const sortOrder = req.query.sortOrder || 'asc';

    // Extract filters from query params
    const filters = {
      hostName: req.query.hostName,
      ipAddress: req.query.ipAddress,
      vulnerabilityRating: req.query.vulnerabilityRating,
      vulnerabilityNumericRating: req.query.vulnerabilityNumericRating !== undefined ? parseInt(req.query.vulnerabilityNumericRating) : undefined,
      certificateIsExpired: req.query.certificateIsExpired ? req.query.certificateIsExpired === 'true' : undefined,
      port: req.query.port ? parseInt(req.query.port) : undefined
    };

    // Apply filters
    let filtered = applyFilters(certificateData, filters);

    // Apply sorting
    let sorted = applySorting(filtered, sortField, sortOrder);

    // Apply pagination
    const pageSize = 20;
    const totalRecords = sorted.length;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = sorted.slice(startIndex, endIndex);

    res.json({
      page,
      pageSize,
      totalRecords,
      totalPages,
      data: pageData
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- GET /certificates/stats - Aggregation endpoint ---
app.get('/certificates/stats', jwtCheck, (req, res) => {
  try {
    const totalCerts = certificateData.length;
    const expiredCerts = certificateData.filter((cert) => cert.CertificateIsExpired === true).length;
    
    // Count vulnerable certs (any with VulnerabilityNumericRating > 0)
    const vulnerableCerts = certificateData.filter((cert) => 
      cert.VulnerabilityNumericRating && cert.VulnerabilityNumericRating > 0
    ).length;

    res.json({
      totalCerts,
      expiredCerts,
      vulnerableCerts,
      healthyPercent: ((totalCerts - expiredCerts - vulnerableCerts) / totalCerts * 100).toFixed(2)
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- GET /certificates-test - Test endpoint (no auth required) ---
app.get('/certificates-test', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 20;
    const totalRecords = certificateData.length;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = certificateData.slice(startIndex, endIndex);

    res.json({
      page,
      pageSize,
      totalRecords,
      totalPages,
      data: pageData,
      note: 'This endpoint does NOT require a JWT'
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Error handler for auth ---
app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid or missing token' });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Certificate Inventory API running on http://localhost:${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/docs`);
});
