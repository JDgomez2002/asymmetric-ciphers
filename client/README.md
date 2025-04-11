# Asymmetric Ciphers Client

A secure file storage client application with end-to-end encryption capabilities. This client allows users to securely store, manage, and verify files using asymmetric encryption algorithms.

## Features

- **Secure Authentication**: User authentication with JWT-based sessions
- **File Encryption**: End-to-end encryption of files using:
  - RSA or ECC asymmetric encryption for key exchange
  - AES-GCM symmetric encryption for file content
- **File Management**:
  - Secure file upload and download
  - File verification with digital signatures
  - File metadata viewing
  - File sorting and organization
- **Key Management**:
  - Generation of encryption key pairs (RSA/ECC)
  - Secure key storage in browser
  - Key synchronization with server
  - Key export functionality

## Technical Stack

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Components**: Custom components with Radix UI primitives
- **State Management**: React Query for server state
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **Cryptography**: Web Crypto API, jsrsasign
- **HTTP Client**: Axios

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Security Features

- **Asymmetric Encryption**: Supports both RSA and ECC algorithms for key exchange
- **Symmetric Encryption**: Uses AES-GCM for file content encryption
- **Digital Signatures**: Optional file signing for verification
- **Secure Key Storage**: Private keys stored securely in browser's local storage
- **Key Synchronization**: Secure key exchange with server

## Development

This project uses ESLint for code quality and TypeScript for type safety. The configuration can be expanded to include additional rules as needed.

For production applications, it's recommended to enable type-aware lint rules by updating the ESLint configuration:

```js
export default tseslint.config({
  extends: [
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```
