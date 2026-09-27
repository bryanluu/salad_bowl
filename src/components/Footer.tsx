import { copy } from '../copy/en.ts'
import { assetUrl } from '../assets.ts'
import { useSound } from '../context/useSound'

function Footer({ showLogo, onQuit }: { showLogo: boolean, onQuit: () => void }) {
  const currentYear = new Date().getFullYear();
  const { play } = useSound()

  function handleQuitClick() {
    // SFX: quit — deliberately distinct from the general `tap` sound
    // (see sounds.ts): this is a destructive/exit action, not a
    // forward-progress one. Plays on tap, before the confirm dialog —
    // onQuit (App.handleQuit) still gates the actual quit on confirmation.
    play('quit')
    onQuit()
  }

  return (
    <footer>
      {showLogo &&
        <button type="button" className="footer__quit" onClick={handleQuitClick}>
          {/* alt="" on both — the visible label below is the button's
              accessible name, so the images stay decorative. Frowning
              face crossfades in on hover/focus/active; default is the
              smiling logo so the button doesn't read as sad at rest. */}
          <span className="footer__quit-icon">
            <img src={assetUrl('logo.svg')} alt="" className="logo logo--smile" />
            <img src={assetUrl('logo-quit.svg')} alt="" className="logo logo--frown" />
          </span>
          <span className="footer__quit-label">{copy.footer.quitLabel}</span>
        </button>}
      <span>© {currentYear} Bryan Luu</span>
    </footer>
  );
}

export default Footer;
