import { copy } from '../copy/en.ts'
import { assetUrl } from '../assets.ts';

function Footer({ showLogo = false, onQuit }: { showLogo: boolean, onQuit: () => void }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      {showLogo &&
        <button type="button" className="footer__quit" onClick={onQuit}>
          {/* alt="" — the visible label below is the button's accessible
              name, so the image stays decorative rather than duplicating it. */}
          <img src={assetUrl('logo.svg')} alt="Cartoon of a smiling salad bowl" className="logo" />
          <span>{copy.footer.quitLabel}</span>
        </button>}
      <span>© {currentYear} Bryan Luu</span>
    </footer>
  );
}

export default Footer;

