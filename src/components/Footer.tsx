import { copy } from '../copy/en.ts'
import { assetUrl } from '../assets.ts'
import { useSoundEffects } from '../hooks/useSoundEffects'

function Footer({ showLogo, onQuit }: { showLogo: boolean, onQuit: () => void }) {
  const { soundOn, setSoundOn } = useSoundEffects()
  const currentYear = new Date().getFullYear();
  const soundLabel = soundOn ? copy.footer.soundOff : copy.footer.soundOn;

  return (
    <footer>
      <div className="footer__actions">
        {/* The sound preference is the one persisted setting (see
            useSoundEffects), so it sits in the footer on every screen,
            start included. aria-pressed carries the state; the label
            always names the action a press will take. */}
        <button
          type="button"
          className="footer__sound"
          aria-pressed={soundOn}
          aria-label={soundLabel}
          title={soundLabel}
          onClick={() => setSoundOn(!soundOn)}
        >
          <span aria-hidden="true">{soundOn ? '🔊' : '🔇'}</span>
        </button>
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
            <span className="footer__quit-label">{copy.footer.quitLabel}</span>
          </button>}
      </div>
      <span>© {currentYear} Bryan Luu</span>
    </footer>
  );
}

export default Footer;
