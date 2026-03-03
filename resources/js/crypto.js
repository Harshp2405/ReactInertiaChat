export async function generateKeyPair() {
    return await window.crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt'],
    );
}

export async function exportPublicKey(key) {
    const exported = await crypto.subtle.exportKey('spki', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function exportPrivateKey(key) {
    const exported = await crypto.subtle.exportKey('pkcs8', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}
