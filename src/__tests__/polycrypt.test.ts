import { webcrypto } from 'node:crypto';
import { Polycrypt } from '../polycrypt.js';

describe('Polycrypt', () => {
  let polycrypt: Polycrypt;

  beforeAll(() => {
    polycrypt = new Polycrypt(webcrypto as Crypto);
  });

  it('should generate key pairs', async () => {
    const keyPair = await polycrypt.generateKeyPair();
    expect(keyPair).toHaveProperty('publicKey');
    expect(keyPair).toHaveProperty('privateKey');
  });

  it('should encrypt and decrypt string data correctly with different key pairs', async () => {
    const keyPair1 = await polycrypt.generateKeyPair();
    const keyPair2 = await polycrypt.generateKeyPair();
    const data = 'Hello, world!';

    const encrypted = await polycrypt.encryptString(keyPair2.publicKey, data);
    expect(encrypted).toHaveProperty('data');
    expect(encrypted).toHaveProperty('key');

    const decrypted = await polycrypt.decryptString(
      keyPair2.privateKey,
      encrypted,
    );
    expect(decrypted).toBe(data);

    // Additional test with the other key pair
    const encrypted2 = await polycrypt.encryptString(
      keyPair1.publicKey,
      'Hello, world222',
    );
    const decrypted2 = await polycrypt.decryptString(
      keyPair1.privateKey,
      encrypted2,
    );
    expect(decrypted2).toBe('Hello, world222');
  });

  it('should not decrypt data with a different key pair', async () => {
    const keyPair1 = await polycrypt.generateKeyPair();
    const keyPair2 = await polycrypt.generateKeyPair();
    const data = 'Hello, world!';

    const encrypted = await polycrypt.encryptString(keyPair1.publicKey, data);

    await expect(
      polycrypt.decryptString(keyPair2.privateKey, encrypted),
    ).rejects.toThrow();
  });

  it('should handle empty strings', async () => {
    const keyPair = await polycrypt.generateKeyPair();
    const data = '';

    const encrypted = await polycrypt.encryptString(keyPair.publicKey, data);
    const decrypted = await polycrypt.decryptString(
      keyPair.privateKey,
      encrypted,
    );

    expect(decrypted).toBe(data);
  });

  it('should handle long strings with different key pairs', async () => {
    const keyPair1 = await polycrypt.generateKeyPair();
    const data = 'A'.repeat(1000);

    const encrypted = await polycrypt.encryptString(keyPair1.publicKey, data);
    expect(encrypted).toHaveProperty('data');
    expect(encrypted).toHaveProperty('key');

    const decrypted = await polycrypt.decryptString(
      keyPair1.privateKey,
      encrypted,
    );
    expect(decrypted).toBe(data);
  });

  it('should encrypt and decrypt JSON data correctly', async () => {
    const keyPair = await polycrypt.generateKeyPair();
    const data = {
      name: 'John Doe',
      age: 30,
      hobbies: ['reading', 'swimming'],
    };

    const encrypted = await polycrypt.encryptJSON(keyPair.publicKey, data);
    expect(encrypted).toHaveProperty('data');
    expect(encrypted).toHaveProperty('key');

    const decrypted = await polycrypt.decryptJSON(
      keyPair.privateKey,
      encrypted,
    );
    expect(decrypted).toEqual(data);
  });

  it('should handle complex nested JSON objects', async () => {
    const keyPair = await polycrypt.generateKeyPair();
    const data = {
      user: {
        name: 'Alice',
        contacts: [
          { name: 'Bob', phone: '123-456-7890' },
          { name: 'Charlie', phone: '098-765-4321' },
        ],
        settings: {
          notifications: true,
          theme: 'dark',
        },
      },
      timestamp: new Date().toISOString(),
    };

    const encrypted = await polycrypt.encryptJSON(keyPair.publicKey, data);
    const decrypted = await polycrypt.decryptJSON(
      keyPair.privateKey,
      encrypted,
    );
    expect(decrypted).toEqual(data);
  });

  it('should handle JSON with special characters', async () => {
    const keyPair = await polycrypt.generateKeyPair();
    const data = {
      message: 'Hello, "world"! How\'s it going?',
      symbols: '!@#$%^&*()_+-={}[]|\\:;"\'<>,.?/~`',
    };

    const encrypted = await polycrypt.encryptJSON(keyPair.publicKey, data);
    const decrypted = await polycrypt.decryptJSON(
      keyPair.privateKey,
      encrypted,
    );
    expect(decrypted).toEqual(data);
  });
});
