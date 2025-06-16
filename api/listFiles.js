// api/listFiles.js

const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
  const dir = path.join(process.cwd(), 'api/data');
  let files = [];
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return res.status(500).json({ 
      error: e.message, 
      cwd: process.cwd(), 
      dirAttempted: dir,
      filesAtRoot: fs.readdirSync(process.cwd())
    });
  }
  return res.status(200).json({ files, cwd: process.cwd(), dirAttempted: dir });
}
