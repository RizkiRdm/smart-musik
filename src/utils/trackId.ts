/**
 * Generates a unique track ID based on filename and file size using SHA-256.
 * This ensures consistent IDs across sessions for the same local file.
 */
export async function generateTrackId(fileName: string, fileSize: number): Promise<string> {
  const data = `${fileName}:${fileSize}`;
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  
  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}
