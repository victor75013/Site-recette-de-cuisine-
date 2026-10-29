const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// On utilise powershell depuis un fichier ps1 pour redimensionner proprement
const psScript = `
Add-Type -AssemblyName System.Drawing
$srcPath = "${path.join(__dirname, '../public/logo.png').replace(/\\/g, '\\\\')}"
$src = [System.Drawing.Image]::FromFile($srcPath)

foreach ($size in @(192, 512)) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, 0, 0, $size, $size)
    $dest = "${path.join(__dirname, '../public/icons').replace(/\\/g, '\\\\')}\\icon-" + $size + ".png"
    $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: icon-$size.png"
}
$src.Dispose()
`;

const tempPsFile = path.join(__dirname, 'temp_gen_icons.ps1');
fs.writeFileSync(tempPsFile, psScript, 'utf8');
try {
  execSync(`powershell -ExecutionPolicy Bypass -File "${tempPsFile}"`, { stdio: 'inherit' });
  console.log('✅ Icônes PWA 192x192 et 512x512 générées.');
} finally {
  if (fs.existsSync(tempPsFile)) fs.unlinkSync(tempPsFile);
}
