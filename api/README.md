# Certificate Inventory API

A Node.js/Express API for querying SSL/TLS certificate inventory data with support for pagination, sorting, filtering, and aggregation. Built with Entra External ID JWT authentication.

## Features

- **JWT Authentication**: Uses Entra External ID (Azure AD) for secure access
- **Pagination**: 20 records per page
- **Sorting**: Sort by any certificate field
- **Filtering**: Filter by HostName, IPAddress, VulnerabilityRating, VulnerabilityNumericRating, CertificateIsExpired, and Port
- **Aggregation**: Get certificate statistics (total, expired, vulnerable)
- **Swagger Documentation**: Interactive API docs at `/docs`
- **CORS Enabled**: Cross-origin requests supported

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment variables** (`.env` already configured):
   ```
   PORT=4000
   JWK_URI=https://9cf28bb0-79d1-4ef0-bdc0-170f670708f4.ciamlogin.com/9cf28bb0-79d1-4ef0-bdc0-170f670708f4/discovery/v2.0/keys
   AUDIENCE=b31552fd-fb5a-4c61-9d87-0b54fa8905a0
   ISSUER=https://9cf28bb0-79d1-4ef0-bdc0-170f670708f4.ciamlogin.com/9cf28bb0-79d1-4ef0-bdc0-170f670708f4/v2.0
   ```

3. **Data file** must be at: `../data/certificate-inventory.json`

## Running

**Development** (with auto-reload):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

The API will start on `http://localhost:4000`

## API Endpoints

### 1. Get Certificates (Paginated, Sortable, Filterable)
**Requires JWT Authentication**

```
GET /certificates?page=1&sortField=HostName&sortOrder=asc&hostName=example
```

**Query Parameters**:
- `page` (int): Page number (default: 1)
- `sortField` (string): Field to sort by (default: HostName)
- `sortOrder` (string): `asc` or `desc` (default: asc)
- `hostName` (string): Filter by hostname (partial match, case-insensitive)
- `ipAddress` (string): Filter by IP address (exact match)
- `vulnerabilityRating` (string): Filter by rating (None, Low, Medium, High)
- `vulnerabilityNumericRating` (int): Filter by numeric rating
- `certificateIsExpired` (boolean): Filter by expiration status
- `port` (int): Filter by port number

**Response**:
```json
{
  "page": 1,
  "pageSize": 20,
  "totalRecords": 731,
  "totalPages": 37,
  "data": [
    {
      "HostName": "app-prod-000.example.com",
      "IPAddress": "68.12.140.63",
      "Port": 443,
      "CertificateIsExpired": false,
      "VulnerabilityRating": "High",
      "VulnerabilityNumericRating": 4,
      ...
    }
  ]
}
```

### 2. Get Certificate Statistics
**Requires JWT Authentication**

```
GET /certificates/stats
```

**Response**:
```json
{
  "totalCerts": 731,
  "expiredCerts": 45,
  "vulnerableCerts": 120,
  "healthyPercent": "82.49"
}
```

### 3. Get Certificates (Test - No Auth)
**No authentication required**

```
GET /certificates-test?page=1
```

**Response**: Same format as `/certificates` endpoint

## Sortable Fields

- HostName
- IPAddress
- Environment
- Port
- Thumbprint
- Subject
- Issuer
- CertificateIsTrusted
- IssuanceDate
- ExpirationDate
- CertificateValidityPeriodInYears
- CertificateValidityPeriodInDays
- CertificateIsExpired
- IsWildcardCertificate
- IsSelfSignedCertificate
- CertificateSubjectMatchesHostName
- SignatureAlgorithm
- NegotiatedCipherSuites
- CipherAlgorithm
- CipherStrength
- KeyExchangeAlgorithm
- KeySize
- StrictTransportSecurity
- SubjectAlternativeNames
- Ssl2 through Ssl3, Tls, Tls11, Tls12, Tls13
- ExpirationCategory
- ExpirationRating
- ExpirationNumericRating
- CertificateChainVulnerabilityTrustRating
- CertificateChainTrustVulnerabilityNumericRating
- CertificateSubjectMatchesHostNameVulnerabilityRating
- CertificateSubjectMatchesHostNameVulnerabilityNumericRating
- CertificateHasSANsVulnerabilityRating
- CertificateHasSANsVulnerabilityNumericRating
- SignatureAlgorithmVulnerabilityRating
- SignatureAlgorithmVulnerabilityNumericRating
- TlsProtocolVulnerabilityRating
- TlsProtocolVulnerabilityNumericRating
- SelfSignedCertificateVulnerabilityRating
- SelfSignedCertificateVulnerabilityNumericRating
- CertValidityPeriodVulnerabilityRating
- CertValidityPeriodVulnerabilityNumericRating
- VulnerabilityCumulativeNumericRating
- VulnerabilityRating
- VulnerabilityNumericRating
- VulnerabilityRatingExplanation

## Filterable Fields

- HostName (partial match)
- IPAddress (exact match)
- VulnerabilityRating
- VulnerabilityNumericRating
- CertificateIsExpired
- Port

## Example Requests

**Get page 2 of expired certificates sorted by ExpirationDate**:
```
GET /certificates?page=2&sortField=ExpirationDate&sortOrder=asc&certificateIsExpired=true
```

**Get vulnerable certificates from a specific IP**:
```
GET /certificates?ipAddress=10.71.52.174&vulnerabilityNumericRating=3
```

**Get statistics**:
```
GET /certificates/stats
```

## Interactive Documentation

Open your browser and navigate to:
```
http://localhost:4000/docs
```

This provides an interactive Swagger UI where you can test all endpoints directly.

## Authentication

The protected endpoints (`/certificates` and `/certificates/stats`) require a valid JWT token from Entra External ID.

Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

The `/certificates-test` endpoint does not require authentication and is useful for connectivity testing.

## Project Structure

```
api/
├── .env
├── package.json
├── swagger.yaml
├── src/
│   └── server.js
├── README.md
└── data/
    └── certificate-inventory.json (symlink from parent)
```

## Dependencies

- **express**: Web framework
- **cors**: Cross-origin request support
- **dotenv**: Environment variable management
- **express-jwt**: JWT middleware
- **jwks-rsa**: JWT key verification via JWKS endpoint
- **swagger-ui-express**: Swagger UI visualization
- **yamljs**: YAML parsing for swagger.yaml
- **nodemon** (dev): Auto-reload during development

## Notes

- The API loads the entire certificate inventory into memory on startup
- Pagination is handled in-memory; for very large datasets, consider database-backed pagination
- Filters are case-insensitive for text fields
- Sorting works on string, numeric, and boolean fields
