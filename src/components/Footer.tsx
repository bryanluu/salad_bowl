import { copy } from '../copy/en.ts'
import { assetUrl } from '../assets.ts'

function Footer({ showLogo, onQuit }: { showLogo: boolean, onQuit: () => void }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      {showLogo &&
        <button type="button" className="footer__quit" onClick={onQuit}>
          {/* alt="" on both — the visible label below is the button's
              accessible name, so the images stay decorative. Frowning
              face crossfades in on hover/focus/active; default is the
              smiling logo so the button doesn't read as sad at rest. */}
          <span className="footer__quit-icon">
            <img src={assetUrl('logo.svg')} alt="" className="logo logo--smile" />
            <img src={assetUrl('logo-quit.svg')} alt="" className="logo logo--frown" />
          </span>
          <span>{copy.footer.quitLabel}</span>
        </button>}
      <span>© {currentYear} Bryan Luu</span>
    </footer>
  );
}

export default Footer;

