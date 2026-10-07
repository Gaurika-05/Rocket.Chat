// Base 64 encoding
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const lookup = new Int8Array(256);
lookup.fill(-1);
for (let i = 0; i < chars.length; i++) {
	lookup[chars.charCodeAt(i)] = i;
}

export class Base64 {
	public static encode(input: Uint8Array | number[] | string): string {
		let bytes: Uint8Array;

		if (typeof input === 'string') {
			bytes = new Uint8Array(input.length);
			for (let i = 0; i < input.length; i++) {
				const code = input.charCodeAt(i);
				if (code > 127) {
					throw new Error('Not ascii. Base64.encode can only take ascii strings.');
				}
				bytes[i] = code;
			}
		} else if (Array.isArray(input)) {
			bytes = Uint8Array.from(input);
		} else {
			bytes = input;
		}

		const len = bytes.length;
		if (len === 0) return '';

		const chunks: string[] = [];
		let i = 0;

		while (i < len - 2) {
			const triple = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
			chunks.push(
				chars[(triple >> 18) & 0x3f] +
				chars[(triple >> 12) & 0x3f] +
				chars[(triple >> 6) & 0x3f] +
				chars[triple & 0x3f]
			);
			i += 3;
		}

		const extra = len % 3;
		if (extra === 1) {
			const triple = bytes[len - 1] << 16;
			chunks.push(
				chars[(triple >> 18) & 0x3f] +
				chars[(triple >> 12) & 0x3f] +
				'=='
			);
		} else if (extra === 2) {
			const triple = (bytes[len - 2] << 16) | (bytes[len - 1] << 8);
			chunks.push(
				chars[(triple >> 18) & 0x3f] +
				chars[(triple >> 12) & 0x3f] +
				chars[(triple >> 6) & 0x3f] +
				'='
			);
		}

		return chunks.join('');
	}

	public static decode(input: string): Uint8Array {
		const len = input.length;
		if (len === 0) return new Uint8Array(0);

		let padding = 0;
		if (input.endsWith('==')) padding = 2;
		else if (input.endsWith('=')) padding = 1;

		const byteLen = Math.floor((len * 3) / 4) - padding;
		const buffer = new Uint8Array(byteLen);
		let bufIdx = 0;
		let i = 0;

		while (i < len) {
			const c1 = input.charCodeAt(i++);
			const c2 = input.charCodeAt(i++);
			const c3 = input.charCodeAt(i++);
			const c4 = input.charCodeAt(i++);

			const v1 = c1 === 61 ? 64 : lookup[c1];
			const v2 = c2 === 61 ? 64 : lookup[c2];
			const v3 = c3 === 61 ? 64 : lookup[c3];
			const v4 = c4 === 61 ? 64 : lookup[c4];

			if (v1 < 0 || v2 < 0 || v3 < 0 || v4 < 0 || v1 === 64 || v2 === 64) {
				throw new Error('invalid base64 string');
			}

			if (v3 === 64 && v4 !== 64) {
				throw new Error('invalid base64 string');
			}

			const chunk = (v1 << 18) | (v2 << 12) | (v3 === 64 ? 0 : v3 << 6) | (v4 === 64 ? 0 : v4);

			if (bufIdx < byteLen) buffer[bufIdx++] = (chunk >> 16) & 0xff;
			if (bufIdx < byteLen && v3 !== 64) buffer[bufIdx++] = (chunk >> 8) & 0xff;
			if (bufIdx < byteLen && v4 !== 64) buffer[bufIdx++] = chunk & 0xff;
		}

		return buffer;
	}
}
