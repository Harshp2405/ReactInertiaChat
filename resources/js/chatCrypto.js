export async function encryptMessage(message, recipientPublicKeyBase64) {
    const binaryDer = Uint8Array.from(atob(recipientPublicKeyBase64), (c) =>
        c.charCodeAt(0),
    );

    const publicKey = await crypto.subtle.importKey(
        'spki',
        binaryDer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt'],
    );

    const encrypted = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        new TextEncoder().encode(message),
    );

    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

export async function decryptMessage(encryptedBase64) {
    const privateKeyBase64 = localStorage.getItem('privateKey');

    const binaryDer = Uint8Array.from(atob(privateKeyBase64), (c) =>
        c.charCodeAt(0),
    );

    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        binaryDer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['decrypt'],
    );

    const decrypted = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0)),
    );

    return new TextDecoder().decode(decrypted);
}
