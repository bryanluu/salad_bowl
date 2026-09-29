import { copy } from '../copy/en.ts'
import { assetUrl } from '../assets.ts'
import { useSoundEffects } from '../hooks/useSoundEffects'

function Footer({ showLogo, onQuit }: { showLogo: boolean, onQuit: () => void }) {
  const { soundOn, setSoundOn } = useSoundEffects()
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <div className="footer__group">
        {/* Decorative and not interactive — clicking it does nothing. It
            only reacts to the Quit link below (see the :has() rules in
            global.css): the frowning face crossfades in while Quit is
            hovered/focused/pressed; default is the smiling logo so the
            group doesn't read as sad at rest. */}
        {showLogo &&
          <span className="footer__logo" aria-hidden="true">
            <img src={assetUrl('logo.svg')} alt="" className="logo logo--smile" />
            <img src={assetUrl('logo-quit.svg')} alt="" className="logo logo--frown" />
          </span>}
        {/* The sound preference is the one persisted setting (see
            useSoundEffects), so this link shows on every screen, start
            included — unlike Quit, which only exists once a game is
            underway. The visible label states the current state and is
            the button's accessible name, so there's deliberately no
            aria-pressed on top of it (it would announce the state twice). */}
        <button
          type="button"
          className="footer__link footer__sound"
          onClick={() => setSoundOn(!soundOn)}
        >
          {copy.footer.soundLabel(soundOn)}
        </button>
        {showLogo &&
          <button type="button" className="footer__link footer__quit" onClick={onQuit}>
            {copy.footer.quitLabel}
          </button>}
      </div>
      <span>© {currentYear} Bryan Luu</span>
    </footer>
  );
}

export default Footer;
