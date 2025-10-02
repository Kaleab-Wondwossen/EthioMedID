export function makeVerifyCode(len = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
  let s = '';
  for (let i=0;i<len;i++) s += alphabet[Math.floor(Math.random()*alphabet.length)];
  return s.slice(0,4) + '-' + s.slice(4); // e.g., ABCD-EFGH
}
