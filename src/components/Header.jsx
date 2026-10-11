import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import CartButton from './CartButton.jsx';

const base = import.meta.env.BASE_URL;

export function Logo() {
  return (
    <a className="logo" href={base} aria-label="Coffee Mall — на главную">
      <img src={`${base}images/logo.png`} alt="" width="55" height="48" />
      <span>Coffee Mall</span>
    </a>
  );
}

const smooth = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

// nav — [{ id, label }], id блока страницы. С nav шапка прилипает к верху, пункты прокручивают
// страницу, а линия под пунктом следует за нажатием и за прокруткой. Без nav — обычная шапка.
export default function Header({ nav, count, onCartClick }) {
  const [active, setActive] = useState(nav?.[0].id);
  const headerRef = useRef(null);
  const navRef = useRef(null);
  const lineRef = useRef(null);
  // После нажатия на пункт линия остаётся под ним, пока страницу не прокрутят вручную.
  // { y, until, arrived }: y — куда едет страница, until — до какого времени ждём приезда
  const pinned = useRef(null);

  useEffect(() => {
    if (!nav) return undefined;
    let frame = 0;

    const update = () => {
      frame = 0;
      const pin = pinned.current;
      if (pin) {
        if (Math.abs(window.scrollY - pin.y) < 8) {
          pin.arrived = true;
          return;
        }
        // Не у цели: страница либо ещё едет к ней, либо её уже увели вручную
        if (!pin.arrived && Date.now() < pin.until) return;
        pinned.current = null;
      }
      const edge = headerRef.current.offsetHeight + window.innerHeight * 0.4;
      let current = nav[0].id;
      for (const { id } of nav) {
        if (document.getElementById(id)?.getBoundingClientRect().top <= edge) current = id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = nav.at(-1).id;
      setActive(current);
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(update);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [nav]);

  useLayoutEffect(() => {
    if (!nav) return undefined;
    const move = () => {
      const link = navRef.current.querySelector('[aria-current="true"]');
      const line = lineRef.current;
      line.style.transform = `translateX(${link.offsetLeft + (link.offsetWidth - line.offsetWidth) / 2}px)`;
    };
    move();
    const observer = new ResizeObserver(move);
    observer.observe(navRef.current);
    return () => observer.disconnect();
  }, [nav, active]);

  const go = (event, id) => {
    event.preventDefault();
    const index = nav.findIndex((item) => item.id === id);
    const bottom = document.documentElement.scrollHeight - window.innerHeight;
    // Первый пункт — к началу страницы, последний — в самый низ, остальные — к своему блоку под шапкой
    let top = 0;
    if (index === nav.length - 1) top = bottom;
    else if (index > 0) {
      top = document.getElementById(id).getBoundingClientRect().top + window.scrollY - headerRef.current.offsetHeight - 24;
    }
    top = Math.max(0, Math.min(top, bottom));
    pinned.current = { y: top, until: Date.now() + 1500 };
    setActive(id);
    window.scrollTo({ top, behavior: smooth() });
  };

  return (
    <header ref={headerRef} className={`header${nav ? ' header--sticky' : ''}`}>
      <div className="container header__inner">
        <Logo />
        {nav && (
          <nav ref={navRef} className="nav" aria-label="Разделы страницы">
            {nav.map(({ id, label }) => (
              <a key={id} href={`#${id}`} aria-current={id === active} onClick={(event) => go(event, id)}>
                {label}
              </a>
            ))}
            <span ref={lineRef} className="nav__line" />
          </nav>
        )}
        <CartButton count={count} onClick={onCartClick} />
      </div>
    </header>
  );
}
