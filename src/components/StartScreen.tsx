import { copy } from '../copy/en.ts'
import { assetUrl } from '../assets.ts'
import { useSound } from '../context/useSound'

function StartScreen({ onStart }: { onStart: () => void }) {
  const { play } = useSound()

  function handleStart() {
    // SFX: tap — general action-button sound (see sounds.ts)
    play('tap')
    onStart()
  }

  return (
    <section className='game-start' aria-labelledby="game-start-title">
      <header>
        <h1 id="game-start-title">
          {copy.start.title}
        </h1>
      </header>
      <img src={assetUrl('logo.svg')} alt="Cartoon of a smiling salad bowl" className="logo" />
      <button className='btn btn--primary' onClick={handleStart} autoFocus>{copy.start.button}</button>
    </section>
  )
}

export default StartScreen
