export class Polycrypt {
  private crypto: Crypto;

  constructor(crypto: Crypto) {
    this.crypto = crypto;
    console.log('Polycrypt initialized with SubtleCrypto');
  }

  /// we are going to use the same algorithm
  /// RSA-OAEP
  /// SHA-256

  async generateKeyPair() {
    const keyPair = await this.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt'],
    );

    const exportedPublicKey = await this.crypto.subtle.exportKey(
      'jwk',
      keyPair.publicKey,
    );
    const exportedPrivateKey = await this.crypto.subtle.exportKey(
      'jwk',
      keyPair.privateKey,
    );

    return { publicKey: exportedPublicKey, privateKey: exportedPrivateKey };
  }

  /// For all operations, accept keys as JSON
  /// We will convert them back to JWK internally

  async restorePublicKey(key: JSON) {
    const publicKey = await this.crypto.subtle.importKey(
      'jwk',
      key as JsonWebKey,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['encrypt'],
    );

    return publicKey;
  }

  async restorePrivateKey(key: JSON) {
    const privateKey = await this.crypto.subtle.importKey(
      'jwk',
      key as JsonWebKey,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['decrypt'],
    );

    return privateKey;
  }

  async encryptAES(data: string) {
    const aesKey = await this.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt'],
    );

    const iv = this.crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await this.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      aesKey,
      new TextEncoder().encode(data),
    );

    const aesKeyJWK = await this.crypto.subtle.exportKey('jwk', aesKey);

    const encrypted64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));

    return {
      key: aesKeyJWK,
      iv: Array.from(iv),
      data: encrypted64,
    };
  }

  async decryptAES(key: JsonWebKey, iv: Array<number>, data64: string) {
    const aesKey = await this.crypto.subtle.importKey(
      'jwk',
      key,
      {
        name: 'AES-GCM',
        hash: 'SHA-256',
      },
      true,
      ['decrypt'],
    );

    const data = Uint8Array.from(atob(data64), (char) => char.charCodeAt(0));

    const decrypted = await this.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
      },
      aesKey,
      data,
    );

    return new TextDecoder().decode(decrypted);
  }

  async encryptString(publicKeyJWK: JSON | JsonWebKey, data: string) {
    const publicKey = await this.restorePublicKey(publicKeyJWK as JSON);

    // Use AES-GCM to encrypt the data
    const {
      key: aesKey,
      iv: aesIV,
      data: aesData64,
    } = await this.encryptAES(data);

    // Encrypt the AES key and IV using RSA-OAEP
    const encryptedKeyData = await this.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      new TextEncoder().encode(
        JSON.stringify({
          key: aesKey,
          iv: aesIV,
        }),
      ),
    );

    // Convert the encrypted key data to base64
    const encryptedKeyData64 = btoa(
      String.fromCharCode(...new Uint8Array(encryptedKeyData)),
    );

    return {
      data: aesData64,
      key: encryptedKeyData64,
    };
  }

  async decryptString(
    privateKeyJWK: JSON | JsonWebKey,
    encryptedPayload: { data: string; key: string },
  ) {
    const privateKey = await this.restorePrivateKey(privateKeyJWK as JSON);

    // Decrypt the AES key and IV
    const encryptedKeyData = new Uint8Array(
      atob(encryptedPayload.key)
        .split('')
        .map((char) => char.charCodeAt(0)),
    );
    const decryptedKeyData = await this.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      privateKey,
      encryptedKeyData,
    );

    const parsedData = JSON.parse(
      new TextDecoder().decode(decryptedKeyData),
    ) as { key: JsonWebKey; iv: number[] };
    const { key: aesKey, iv } = parsedData;

    // Decrypt the data using AES-GCM
    const decryptedData = await this.decryptAES(
      aesKey,
      iv,
      encryptedPayload.data,
    );

    return decryptedData;
  }

  async encryptJSON(publicKeyJWK: JSON | JsonWebKey, data: object) {
    const jsonString = JSON.stringify(data);
    return await this.encryptString(publicKeyJWK, jsonString);
  }

  async decryptJSON(
    privateKeyJWK: JSON | JsonWebKey,
    encryptedPayload: { data: string; key: string },
  ): Promise<unknown> {
    const decryptedString = await this.decryptString(
      privateKeyJWK,
      encryptedPayload,
    );
    return JSON.parse(decryptedString) as unknown;
  }
}
