# Asymmetric Ciphers API

A modern API service built with Bun, Hono, and Drizzle ORM for handling asymmetric cryptography operations. This service provides secure authentication, encryption, and data protection features.

## 🚀 Tech Stack

- **Runtime**: [Bun](https://bun.sh/) - Fast all-in-one JavaScript runtime
- **Framework**: [Hono](https://hono.dev/) - Ultrafast web framework
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Validation**: [Zod](https://zod.dev/) - TypeScript-first schema validation
- **Package Manager**: [pnpm](https://pnpm.io/)

## 📋 Prerequisites

- [Bun](https://bun.sh/) installed on your system
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed
- PostgreSQL client (optional, for direct database access)

## 🛠️ Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd asymmetric-ciphers/api
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` (if available)
   - Configure your environment variables in `.env`

## 🏃‍♂️ Running the Project

1. Start the PostgreSQL database:

   ```bash
   docker-compose up -d
   ```

2. Run database migrations:

   ```bash
   pnpm db:push
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

## 📦 Available Scripts

- `pnpm dev` - Start the development server with hot reloading
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio for database management
- `pnpm db:push` - Push schema changes to the database

## 🗄️ Database

The project uses PostgreSQL with Drizzle ORM for database management. The database is containerized using Docker for easy setup and development.

### Database Configuration

- Host: localhost
- Port: 5432
- Database: cryptography
- Default credentials can be configured in the `.env` file

## 📁 Project Structure

```
.
├── src/            # Source code
├── drizzle/        # Database migrations and schema
├── files/          # File storage
├── node_modules/   # Dependencies
└── docker-compose.yml  # Docker configuration
```

## 🔒 Environment Variables

Create a `.env` file with the following variables:

```
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=cryptography

# Security Configuration
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key
BCRYPT_SALT_ROUNDS=12
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔐 Security Features

### Authentication & Authorization

- **JWT (JSON Web Tokens)**: Secure token-based authentication system
  - Tokens are signed with a private key and verified with a public key
  - Tokens contain user identity and permissions
  - Automatic token expiration for enhanced security

### Password Security

- **Bcrypt Hashing**: Passwords are never stored in plain text
  - Uses bcrypt for secure password hashing
  - Automatic salt generation for each password
  - Protection against rainbow table attacks

### Data Encryption

- **Asymmetric Encryption**: Public/Private key pairs for secure data exchange

  - Public keys can be shared openly
  - Private keys are kept secret
  - Perfect for secure communication between parties

- **Symmetric Encryption**: Fast encryption for large data
  - Uses AES (Advanced Encryption Standard)
  - Secure key exchange using asymmetric encryption
  - Ideal for encrypting files and large messages

### Security Best Practices

- All sensitive data is encrypted at rest
- Secure password reset mechanisms
- Protection against common attacks (XSS, CSRF, SQL Injection)
- Regular security audits and updates

## 📚 Security Documentation

### Authentication Flow

1. User registers with email and password
2. Password is hashed with bcrypt and stored
3. User logs in with credentials
4. Server verifies password hash
5. JWT token is generated and returned
6. Token is used for subsequent authenticated requests

### Encryption Process

1. Generate key pairs (public/private) for asymmetric encryption
2. Exchange public keys between parties
3. Use symmetric encryption (AES) for data
4. Encrypt symmetric key with recipient's public key
5. Send encrypted data and encrypted key
6. Recipient decrypts key with private key
7. Recipient decrypts data with symmetric key

### Password Security

- Passwords must be at least 8 characters long
- Must contain uppercase, lowercase, numbers, and special characters
- Passwords are hashed using bcrypt with 12 salt rounds
- Password reset tokens expire after 1 hour
