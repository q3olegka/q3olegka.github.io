// Готовит фото для сайта: исходники из images/ — в лёгкие WebP в public/images/.
// Запуск: npm run images
import { mkdir, readdir } from 'node:fs/promises';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const root = join(import.meta.dirname, '..');
const source = join(root, 'images');
const target = join(root, 'public', 'images');

await mkdir(target, { recursive: true });

for (const file of await readdir(source)) {
  const { name, ext } = parse(file);
  if (!/^\.(png|jpe?g)$/i.test(ext)) continue;
  const image = sharp(join(source, file));
  if (name.startsWith('logo')) {
    await image.clone().resize({ width: 220 }).png({ compressionLevel: 9 }).toFile(join(target, 'logo.png'));
    await image
      .clone()
      .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(join(root, 'public', 'favicon.png'));
  } else {
    await image.resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toFile(join(target, `${name}.webp`));
  }
  console.log(file);
}
