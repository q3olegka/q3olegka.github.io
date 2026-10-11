import deleteSvg from '@material-symbols/svg-400/outlined/delete.svg?raw';
import giftSvg from '@material-symbols/svg-400/outlined/featured_seasonal_and_gifts.svg?raw';
import mopedSvg from '@material-symbols/svg-400/outlined/moped_package.svg?raw';
import clockSvg from '@material-symbols/svg-400/outlined/schedule.svg?raw';

// Значки Material Symbols — те же, что в макете; цвет берут у текста
function materialIcon(svg) {
  return function MaterialIcon({ size = 24 }) {
    return <span className="micon" style={{ width: size, height: size }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
  };
}

export const DeleteIcon = materialIcon(deleteSvg);
export const GiftIcon = materialIcon(giftSvg);
export const MopedIcon = materialIcon(mopedSvg);
export const ClockIcon = materialIcon(clockSvg);

// Значок соцсети из набора simple-icons
export function BrandIcon({ icon, size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d={icon.path} />
    </svg>
  );
}
